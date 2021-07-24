import { GlobalCommandHandler, GuildCommandHandler, GuildCommandHandlerGroup, AdminCommandData, AdminEmbedFactory, AdminSelectMenuFactory, AdminButtonFactory } from '../../..';
import { InteractionReplyOptions, MessageActionRow, CommandInteraction, ButtonInteraction, SelectMenuInteraction, Guild, MessageSelectMenu } from 'discord.js';
import { ButtonHandler, CommandClient, HandlerCustomData, SelectMenuHandler, HandlerResult, HandlerContext } from 'discord.js-commands';

export enum AdminButtonType { ENABLE = 'add', DISABLE = 'del' }
export interface AdminCustomData extends HandlerCustomData {
    sub: 'commands',
    group?: GuildCommandHandlerGroup,
    type?: AdminButtonType
}

export class AdminHandler extends GlobalCommandHandler implements ButtonHandler<AdminCustomData>, SelectMenuHandler<AdminCustomData> {

    public readonly selectMenuFactory: AdminSelectMenuFactory;
    public readonly buttonFactory: AdminButtonFactory;
    public readonly embedFactory: AdminEmbedFactory;

    constructor() {
        super({ id: 'admin', nsfw: false, commandData: AdminCommandData });
        this.selectMenuFactory = new AdminSelectMenuFactory(this);
        this.buttonFactory = new AdminButtonFactory(this);
        this.embedFactory = new AdminEmbedFactory(this);
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        if (!this.isAdmin(interaction)) {
            const response = this.getForbiddenResponse(interaction, 'You must have \`ADMINISTRATOR\` permissions');
            return interaction.reply(response);
        }
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

    public async onSelectMenu(interaction: SelectMenuInteraction, customData: AdminCustomData): Promise<any> {
        if (!this.isAdmin(interaction)) {
            const response = this.getForbiddenResponse(interaction, 'You must have \`ADMINISTRATOR\` permissions');
            return interaction.reply(response);
        }
        await interaction.deferUpdate();
        switch (customData.sub) {
            case 'commands': {
                if (!customData.group) {
                    const group = interaction.values[0] as GuildCommandHandlerGroup;
                    const response = await this.fetchCommandResponse(interaction, group);
                    return interaction.editReply(response);
                } else {
                    const response = await this.fetchCommandResponse(interaction, customData.group, interaction.values);
                    return interaction.editReply(response);
                }
            }
        }
    }

    public async onButton(interaction: ButtonInteraction, customData: AdminCustomData): Promise<any> {
        if (!this.isAdmin(interaction)) {
            const response = this.getForbiddenResponse(interaction, 'You must have \`ADMINISTRATOR\` permissions');
            return interaction.reply(response);
        }
        await interaction.deferUpdate();
        const { guild } = <{ guild: Guild }>interaction;
        switch (customData.sub) {
            case 'commands': {
                if (!(interaction.client instanceof CommandClient)) throw interaction;
                const handlerSelectMenu = <MessageSelectMenu>interaction.message.components![1]!.components[0]!;
                const handlerIds = handlerSelectMenu.options.filter(option => option.default).map(option => option.value);
                for (const handlerId of handlerIds) {
                    const handler = interaction.client.handlers.find(handler => handler instanceof GuildCommandHandler && handler.id === handlerId) as GuildCommandHandler;
                    if (customData.type === AdminButtonType.ENABLE) await handler.enable(guild, interaction);
                    if (customData.type === AdminButtonType.DISABLE) await handler.disable(guild, interaction);
                }
                if (!interaction.replied) {
                    const response = await this.fetchCommandResponse(interaction, customData.group, handlerIds);
                    return interaction.editReply(response);
                }
            }
        }
    }

    public async fetchCommandResponse(context: HandlerContext, group?: GuildCommandHandlerGroup, handlerIds?: Array<string>): Promise<InteractionReplyOptions> {
        if (!(context.client instanceof CommandClient)) throw context;
        const embed = await this.embedFactory.fetchCommandsEmbed(context);
        const groupActionRow = this.selectMenuFactory.getGuildHandlerGroupSelectMenu(group).toActionRow();
        if (!group) return { embeds: [embed], components: [groupActionRow] };
        const handlers = context.client.handlers.filter(handler => handler instanceof GuildCommandHandler && handlerIds && handlerIds.includes(handler.id)) as [GuildCommandHandler, ...GuildCommandHandler[]];
        const handlerActionRow = this.selectMenuFactory.getGuildHandlerSelectMenu(context, group, handlers).toActionRow();
        if (!handlers.length) return { embeds: [embed], components: [groupActionRow, handlerActionRow] }
        const handlerButtonActionRow = new MessageActionRow().addComponents([
            this.buttonFactory.getAdminButton(AdminButtonType.ENABLE, group, handlers),
            this.buttonFactory.getAdminButton(AdminButtonType.DISABLE, group, handlers)
        ]);
        return { embeds: [embed], components: [groupActionRow, handlerActionRow, handlerButtonActionRow] }
    }

    public override async initialise(client: CommandClient): Promise<HandlerResult> {
        const globalHandlers = [];
        const commands = await client.application!.commands.fetch();
        for (const handler of client.handlers) {
            if (!handler.isCommandHandler()) continue;
            if (handler instanceof GuildCommandHandler) continue;
            const command = commands.find((command => command.name === handler.commandData.name));
            if (!command) await client.application!.commands.create(handler.commandData);
            globalHandlers.push(handler);
        }
        return { message: `Found ${globalHandlers.length} global command handlers` }
    }
}
