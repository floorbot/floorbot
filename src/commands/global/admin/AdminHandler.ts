import { InteractionReplyOptions, MessageActionRow, CommandInteraction, ButtonInteraction, SelectMenuInteraction, MessageSelectMenu, Permissions } from 'discord.js';
import { AdminCommandData, GlobalHandler, AdminEmbedFactory, GuildHandler, GuildHandlerGroup, AdminSelectMenuFactory, AdminButtonFactory } from '../../..';
import { CommandClient, HandlerCustomData, HandlerResult, HandlerContext } from 'discord.js-commands';

export enum AdminButtonType { ENABLE = 'add', DISABLE = 'del' }
export interface AdminCustomData extends HandlerCustomData {
    sub: 'commands',
    group?: GuildHandlerGroup,
    type?: AdminButtonType
}

export class AdminHandler extends GlobalHandler<AdminCustomData> {

    constructor() {
        super({ id: 'admin', commandData: AdminCommandData, permissions: [Permissions.FLAGS.ADMINISTRATOR] });
    }

    public override async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();
        const subCommand = interaction.options.getSubCommand();
        switch (subCommand) {
            case 'commands': {
                const response = await this.fetchCommandResponse(interaction);
                return interaction.followUp(response);
            }
            default: throw interaction;
        }
    }

    public override async onSelectMenu(interaction: SelectMenuInteraction, customData: AdminCustomData): Promise<any> {
        await interaction.deferUpdate();
        switch (customData.sub) {
            case 'commands': {
                if (!customData.group) {
                    const group = interaction.values[0] as GuildHandlerGroup;
                    const response = await this.fetchCommandResponse(interaction, group);
                    return interaction.editReply(response);
                } else {
                    const response = await this.fetchCommandResponse(interaction, customData.group, interaction.values);
                    return interaction.editReply(response);
                }
            }
        }
    }

    public override async onButton(interaction: ButtonInteraction, customData: AdminCustomData): Promise<any> {
        await interaction.deferUpdate();
        switch (customData.sub) {
            case 'commands': {
                if (!(interaction.client instanceof CommandClient)) throw interaction;
                const handlerSelectMenu = <MessageSelectMenu>interaction.message.components![1]!.components[0]!;
                const handlerIds = handlerSelectMenu.options.filter(option => option.default).map(option => option.value);
                for (const handlerId of handlerIds) {
                    const handler = interaction.client.handlers.find(handler => handler instanceof GuildHandler && handler.id === handlerId) as GuildHandler<any>;
                    if (customData.type === AdminButtonType.ENABLE) await handler.enable(interaction, customData);
                    if (customData.type === AdminButtonType.DISABLE) await handler.disable(interaction, customData);
                }
                if (!interaction.replied) {
                    const response = await this.fetchCommandResponse(interaction, customData.group, handlerIds);
                    return interaction.editReply(response);
                }
            }
        }
    }

    public async fetchCommandResponse(context: HandlerContext, group?: GuildHandlerGroup, handlerIds?: Array<string>): Promise<InteractionReplyOptions> {
        if (!(context.client instanceof CommandClient)) throw context;
        const embed = await AdminEmbedFactory.fetchCommandsEmbed(this, context);
        const groupActionRow = AdminSelectMenuFactory.getGuildHandlerGroupSelectMenu(this, group).toActionRow();
        if (!group) return { embeds: [embed], components: [groupActionRow] };
        const handlers = context.client.handlers.filter(handler => handler instanceof GuildHandler && handlerIds && handlerIds.includes(handler.id)) as [GuildHandler<any>, ...GuildHandler<any>[]];
        const handlerActionRow = AdminSelectMenuFactory.getGuildHandlerSelectMenu(this, context, group, handlers).toActionRow();
        if (!handlers.length) return { embeds: [embed], components: [groupActionRow, handlerActionRow] }
        const handlerButtonActionRow = new MessageActionRow().addComponents([
            AdminButtonFactory.getAdminButton(this, AdminButtonType.ENABLE, group, handlers),
            AdminButtonFactory.getAdminButton(this, AdminButtonType.DISABLE, group, handlers)
        ]);
        return { embeds: [embed], components: [groupActionRow, handlerActionRow, handlerButtonActionRow] }
    }

    public override async initialise(client: CommandClient): Promise<HandlerResult> {
        const globalHandlers = [];
        const commands = await client.application!.commands.fetch();
        for (const handler of client.handlers) {
            if (!handler.isCommandHandler()) continue;
            if (handler instanceof GuildHandler) continue;
            const command = commands.find((command => command.name === handler.commandData.name));
            if (!command) await client.application!.commands.create(handler.commandData);
            globalHandlers.push(handler);
        }
        return { message: `Found ${globalHandlers.length} global command handlers` }
    }
}
