import { CommandInteraction, Guild, Message, MessageActionRow, MessageButton, Constants, InteractionReplyOptions, SelectMenuInteraction, ApplicationCommand, Interaction } from 'discord.js';
import { ChatInputHandler } from '../../../discord/handler/abstracts/ChatInputHandler';
import { HandlerClient } from '../../../discord/handler/HandlerClient';
import { HandlerUtil } from '../../../discord/handler/HandlerUtil';
import { HandlerReply } from '../../../helpers/HandlerReply';
import { Handler } from '../../../discord/handler/Handler';
import { AdminCommandData } from './AdminCommandData';
import { AdminSelectMenu } from './AdminSelectMenu';
import { AdminEmbed } from './AdminEmbed';

const { MessageButtonStyles, ApplicationCommandTypes } = Constants;

export type HandlerMap = Map<Handler<any>, ApplicationCommand | undefined>;
export type GroupHandlerMap = Map<string, HandlerMap>;

export class AdminHandler extends ChatInputHandler {

    constructor() {
        super({ group: 'Global', global: true, nsfw: false, data: AdminCommandData });
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {
        const subCommand = command.options.getSubcommand();
        const { guild, member } = command;
        if (!guild) return command.reply(new AdminEmbed(command).setDescription(`Sorry! You can only use this command in a guild!`).toReplyOptions());
        if (!HandlerUtil.isAdminOrOwner(member)) return command.reply(HandlerReply.createAdminOrOwnerReply(command));
        switch (subCommand) {
            case 'commands': {
                await command.deferReply();
                let groupComponent: SelectMenuInteraction | undefined = undefined;
                let commandsComponent: SelectMenuInteraction | undefined = undefined;
                let groupHandlerMap = await this.fetchHandlerMap(guild);
                const response = this.createResponse(command, groupHandlerMap, groupComponent, commandsComponent);
                let message = await command.followUp(response) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', async (component) => {
                    if (!HandlerUtil.isAdminOrOwner(member, command)) return command.reply(HandlerReply.createAdminOrOwnerReply(command));
                    if (component.isSelectMenu() && component.customId === 'groups') {
                        await component.deferUpdate();
                        const response = this.createResponse(command, groupHandlerMap, groupComponent = component, commandsComponent = undefined);
                        message = await (<Message>component.message).edit(response);
                    }
                    if (component.isSelectMenu() && component.customId === 'commands') {
                        await component.deferUpdate();
                        const response = this.createResponse(command, groupHandlerMap, groupComponent, commandsComponent = component);
                        message = await (<Message>component.message).edit(response);
                    }
                    if (component.isButton()) {
                        await component.deferUpdate();
                        const group = groupComponent!.values[0]!;
                        const handlers = [...groupHandlerMap.get(group)!.keys()];
                        for (const [index, handler] of handlers.entries()) {
                            if (commandsComponent!.values.includes(index.toString())) {
                                if (component.customId === 'enable') await guild.commands.create(handler.data);
                                if (component.customId === 'disable') {
                                    const appCommands = await guild.commands.fetch();
                                    const appCommand = appCommands.find(appCommand => this.isCorrectHandler(handler, appCommand));
                                    if (appCommand) await appCommand.delete();
                                }
                            }
                        }
                        groupHandlerMap = await this.fetchHandlerMap(guild);
                        const response = this.createResponse(command, groupHandlerMap, groupComponent, commandsComponent);
                        message = await (<Message>component.message).edit(response);
                    }
                });
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                return message;
            }
            default: throw command;
        }
    }

    public override async setup(client: HandlerClient): Promise<any> {
        await super.setup(client);
        if (client.application) {
            const handlers = client.handlers.filter(handler => handler.global);
            const appCommands = await client.application.commands.fetch();
            for (const handler of handlers) {
                const appCommand = appCommands.find(appCommand => this.isCorrectHandler(handler, appCommand));
                if (!appCommand) {
                    const posted = await client.application.commands.create(handler.data);
                    client.emit('log', `[setup](${handler.toString()}) Posted missing global command to discord <${posted.id}>`)
                }
            }
        }
    }

    private createResponse(interaction: Interaction<'cached'>, groupHandlerMap: GroupHandlerMap, groupComponent?: SelectMenuInteraction, commandsComponent?: SelectMenuInteraction): InteractionReplyOptions {
        return {
            embeds: [AdminEmbed.createCommandsEmbed(interaction, groupHandlerMap)],
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
        const handlers = client.handlers.filter(handler => !handler.global);
        const appCommands = await guild.commands.fetch();
        const groupHandlerMap = new Map();
        for (const handler of handlers) {
            const appCommand = appCommands.find(appCommand => this.isCorrectHandler(handler, appCommand));
            if (!groupHandlerMap.has(handler.group)) groupHandlerMap.set(handler.group, new Map());
            groupHandlerMap.get(handler.group).set(handler, appCommand);
        }
        return groupHandlerMap;
    }

    private isCorrectHandler(handler: Handler<any>, appCommand: ApplicationCommand) {
        if (appCommand.name !== handler.data.name) return false;
        switch (true) {
            case (handler.data.type === undefined && appCommand.type === 'CHAT_INPUT'):
            case (handler.data.type === ApplicationCommandTypes.USER && appCommand.type === 'USER'):
            case (handler.data.type === ApplicationCommandTypes.MESSAGE && appCommand.type === 'MESSAGE'):
            case (handler.data.type === ApplicationCommandTypes.CHAT_INPUT && appCommand.type === 'CHAT_INPUT'): {
                return true;
            }
            default: {
                return false;
            }
        }
    }
}
