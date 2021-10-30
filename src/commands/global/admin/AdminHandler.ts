import { Client, CommandInteraction, Guild, GuildMember, Message, MessageActionRow, MessageButton, Permissions, Constants, InteractionReplyOptions, SelectMenuInteraction, MessageComponentInteraction } from 'discord.js';
import { CommandHandlerSchema, HandlerClient } from '../../../discord/HandlerClient';
import { HandlerContext } from '../../../discord/Util';
import { AdminCommandData } from './AdminCommandData';
import { AdminSelectMenu } from './AdminSelectMenu';
import { Handler } from '../../../discord/Handler';
import { BaseHandler } from '../../BaseHandler';
import { AdminEmbed } from './AdminEmbed';

const { MessageButtonStyles } = Constants;

export type HandlerMap = Map<string, { handler: Handler, appCommand: CommandHandlerSchema | null }>;
export type GroupHandlerMap = Map<string, HandlerMap>;

export class AdminHandler extends BaseHandler {

    constructor() {
        super({
            id: 'admin',
            group: 'Global',
            global: true,
            nsfw: false,
            data: AdminCommandData
        })
    }

    public async execute(interaction: CommandInteraction): Promise<any> {
        const subCommand = interaction.options.getSubcommand();
        const { client, guild } = <{ client: Client, guild: Guild }>interaction;
        if (!(client instanceof HandlerClient)) throw interaction;
        if (!guild) return interaction.reply(this.getEmbedTemplate(interaction).setDescription(`Sorry! You can only use this command in a guild!`).toReplyOptions());
        if (await this.replyIfAdmin(interaction)) return;
        switch (subCommand) {
            case 'commands': {
                await interaction.deferReply();
                let groupComponent: SelectMenuInteraction | undefined = undefined;
                let commandsComponent: SelectMenuInteraction | undefined = undefined;
                let groupHandlerMap = await this.fetchHandlerMap(guild);
                const response = this.createResponse(interaction, groupHandlerMap, groupComponent, commandsComponent);
                let message = await interaction.followUp(response) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', async (component) => {
                    if (await this.replyIfAdmin(component)) return;
                    if (component.isSelectMenu() && component.customId === 'groups') {
                        await component.deferUpdate();
                        const response = this.createResponse(interaction, groupHandlerMap, groupComponent = component, commandsComponent = undefined);
                        message = await (<Message>component.message).edit(response);
                    }
                    if (component.isSelectMenu() && component.customId === 'commands') {
                        await component.deferUpdate();
                        const response = this.createResponse(interaction, groupHandlerMap, groupComponent, commandsComponent = component);
                        message = await (<Message>component.message).edit(response);
                    }
                    if (component.isButton()) {
                        await component.deferUpdate();
                        const group = groupComponent!.values[0]!;
                        const handlers = groupHandlerMap.get(group)!.values();
                        for (const { handler } of handlers) {
                            if (commandsComponent!.values.includes(handler.id)) {
                                if (component.customId === 'enable') await client.postCommand(handler, guild);
                                if (component.customId === 'disable') {
                                    const appCommand = await client.fetchGuildAppCommand(handler, guild);
                                    if (appCommand) await client.deleteCommand(appCommand, guild);
                                }
                            }
                        }
                        groupHandlerMap = await this.fetchHandlerMap(guild);
                        const response = this.createResponse(interaction, groupHandlerMap, groupComponent, commandsComponent);
                        message = await (<Message>component.message).edit(response);
                    }
                });
                collector.on('end', this.createEnderFunction(message));
                return message;
            }
            default: throw interaction;
        }
    }

    private async replyIfAdmin(context: CommandInteraction | MessageComponentInteraction): Promise<Message | null> {
        if (!(context.member as GuildMember).permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const response = this.getEmbedTemplate(context).setDescription(`Sorry! Only admins can use the admin command`).toReplyOptions(true);
            return await context.reply({ ...response, fetchReply: true }) as Message;
        }
        return null;
    }

    private createResponse(context: HandlerContext, groupHandlerMap: GroupHandlerMap, groupComponent?: SelectMenuInteraction, commandsComponent?: SelectMenuInteraction): InteractionReplyOptions {
        return {
            embeds: [AdminEmbed.createCommandsEmbed(context, groupHandlerMap)],
            components: [
                AdminSelectMenu.createGroupsSelectMenu(groupHandlerMap, groupComponent).toActionRow(),
                ...(groupComponent ? [AdminSelectMenu.createHandlerSelectMenu(groupHandlerMap, groupComponent, commandsComponent).toActionRow()] : []),
                ...(commandsComponent && commandsComponent.values.length ? [new MessageActionRow().addComponents([
                    new MessageButton().setLabel('Enable Commands').setStyle(MessageButtonStyles.SUCCESS).setCustomId('enable'),
                    new MessageButton().setLabel('Disable Commands').setStyle(MessageButtonStyles.DANGER).setCustomId('disable')
                ])] : [])
            ]
        };
    }

    private async fetchHandlerMap(guild: Guild): Promise<GroupHandlerMap> {
        const client = guild.client as HandlerClient;
        const handlers = client.getAllHandlers().filter(handler => !handler.global);
        const appCommands = await client.fetchGuildCommands(guild);
        const groupHandlerMap = new Map();
        for (const handler of handlers) {
            const appCommand = appCommands.find(appCommand => appCommand.handler_id === handler.id) ?? null;
            if (!groupHandlerMap.has(handler.group)) groupHandlerMap.set(handler.group, new Map());
            groupHandlerMap.get(handler.group).set(handler.id, { handler, appCommand });
        }
        return groupHandlerMap;
    }
}
