import { ButtonInteraction, ApplicationCommandData, GuildMember, CommandInteraction, SelectMenuInteraction, MessageOptions, Collection, MessageActionRow } from 'discord.js';
import { CommandClient, BaseHandler, CommandHandler, ButtonHandler, HandlerContext, SelectMenuHandler } from 'discord.js-commands';
import { AdminCommandData } from './AdminCommandData';

import { AdminButton, AdminButtonCustomData } from './message/AdminButton';

import { MissingAdminEmbed } from './message/embeds/MissingAdminEmbed';
import { CommandsEmbed } from './message/embeds/CommandsEmbed';

import { HandlerSelectMenu } from './message/selectmenus/HandlerSelectMenu';
import { GroupSelectMenu } from './message/selectmenus/GroupSelectMenu';
import { AdminSelectMenuCustomData } from './message/AdminSelectMenu';

export class AdminHandler extends BaseHandler implements CommandHandler, ButtonHandler, SelectMenuHandler {

    public readonly commandData: ApplicationCommandData;
    public readonly isGlobal: boolean;

    constructor(client: CommandClient) {
        super(client, { id: 'admin', name: 'Admin', group: 'Admin', nsfw: false });
        this.commandData = AdminCommandData;
        this.isGlobal = true;
    }

    public async onButton(interaction: ButtonInteraction, customData: any): Promise<any> {
        const data = <AdminButtonCustomData>customData;
        const member = <GuildMember>interaction.member;
        if (!this.isAdmin(member)) return new MissingAdminEmbed(interaction, customData.fn).toReplyOptions(true);

        await interaction.deferUpdate();
        switch (data.sub) {
            case 'commands': {
                const handler = <CommandHandler>this.client.handlers.get(data.handler);
                if (data.action === 'add') await handler.enable(interaction);
                if (data.action === 'del') await handler.disable(interaction);
                if (!interaction.replied) {
                    const response = await this.fetchCommandResponse(interaction, data.group, data.handler);
                    return interaction.editReply(response);
                }
            }
        }
    }

    public async onSelectMenu(interaction: SelectMenuInteraction, customData: any): Promise<any> {
        customData = <AdminSelectMenuCustomData>customData;
        const member = <GuildMember>interaction.member;
        if (!this.isAdmin(member)) return new MissingAdminEmbed(interaction, customData.fn).toReplyOptions(true);
        await interaction.deferUpdate();
        switch (customData.sub) {
            case 'commands': {
                const value = JSON.parse(interaction.values[0]);
                const response = await this.fetchCommandResponse(interaction, value.group, value.command);
                return interaction.editReply(response);
            }
        }
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();

        if (!this.isAdmin(<GuildMember>interaction.member)) {
            const embed = this.getEmbedTemplate(interaction)
                .setDescription(`Sorry! you must be an admin to use \`/admin\` commands!`)
            return interaction.followUp({ embeds: [embed], ephemeral: true });
        }
        if (interaction.options.has('commands')) {
            const response = await this.fetchCommandResponse(interaction);
            return interaction.followUp(response);
        }
    }

    private async fetchCommandResponse(context: HandlerContext, group?: string, command?: string): Promise<MessageOptions> {
        const guildCommands = await context.guild!.commands.fetch();
        const guildHandlers = this.getGuildHandlers();
        const embed = new CommandsEmbed(context, guildCommands, guildHandlers);

        const groupActionRow = new GroupSelectMenu(Array.from(guildHandlers.keys()), group).asActionRow();
        if (!group) return { embeds: [embed], components: [groupActionRow] }

        const handlers = guildHandlers.get(group) ?? [];
        const commandActionRow = new HandlerSelectMenu(handlers, command).asActionRow();
        if (!command) return { embeds: [embed], components: [groupActionRow, commandActionRow] }

        const handler = <CommandHandler>this.client.handlers.get(command)!;
        const buttonActionRow = new MessageActionRow().addComponents([
            new AdminButton(handler, 'commands', 'add'),
            new AdminButton(handler, 'commands', 'del')
        ])
        return { embeds: [embed], components: [groupActionRow, commandActionRow, buttonActionRow] }
    }

    private getGuildHandlers(): Collection<string, Array<CommandHandler>> {
        return this.client.handlers.reduce((collection, handler: BaseHandler) => {
            if (!handler.isCommandHandler() || handler.isGlobal) return collection;
            if (!collection.has(handler.group)) collection.set(handler.group, []);
            collection.get(handler.group)!.push(handler);
            return collection;
        }, new Collection<string, Array<CommandHandler>>());
    }

    public async initialise(): Promise<any> {
        const application = this.client.application;
        const commands = await application!.commands.fetch();
        return Promise.all(this.client.handlers.filter((handler) => {
            return handler.isCommandHandler() && handler.isGlobal;
        }).map((handler: BaseHandler) => {
            if (!handler.isCommandHandler()) return;
            const found = commands.find((command => command.name === handler.commandData.name));
            if (!found) return this.client.application!.commands.create(handler.commandData);
            // Could check equality and repost when already exists
        })).then(res => {
            this.client.emit('log', `[setup](${this.id}) Posted ${res.length} global command${res.length ? 's' : ''} to Discord`);
            return true;
        });
    }
}
