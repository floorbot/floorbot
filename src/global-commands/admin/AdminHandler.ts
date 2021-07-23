import { GlobalCommandHandler, GuildCommandHandler, GuildCommandHandlerGroup, AdminResponseFactory, AdminCommandData, AdminEmbedFactory, AdminSelectMenuFactory, AdminButtonFactory } from '../../..';
import { ButtonHandler, CommandClient, HandlerCustomData, SelectMenuHandler, HandlerResult } from 'discord.js-commands';
import { CommandInteraction, ButtonInteraction, SelectMenuInteraction, Guild, MessageSelectMenu } from 'discord.js';

export enum AdminButtonType { ENABLE = 'add', DISABLE = 'del' }
export interface AdminCustomData extends HandlerCustomData {
    sub: 'commands',
    group?: GuildCommandHandlerGroup,
    type?: AdminButtonType
}

export class AdminHandler extends GlobalCommandHandler implements ButtonHandler<AdminCustomData>, SelectMenuHandler<AdminCustomData> {

    public readonly selectMenuFactory: AdminSelectMenuFactory;
    public readonly responseFactory: AdminResponseFactory;
    public readonly buttonFactory: AdminButtonFactory;
    public readonly embedFactory: AdminEmbedFactory;

    constructor() {
        super({ id: 'admin', nsfw: false, commandData: AdminCommandData });
        this.selectMenuFactory = new AdminSelectMenuFactory(this);
        this.responseFactory = new AdminResponseFactory(this);
        this.buttonFactory = new AdminButtonFactory(this);
        this.embedFactory = new AdminEmbedFactory(this);
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        if (!this.isAdmin(interaction)) {
            const embed = this.responseFactory.getForbiddenEmbed(interaction, this, 'You must have \`ADMINISTRATOR\` permissions');
            return interaction.reply(embed.toReplyOptions(true));
        }
        await interaction.defer();
        const subCommand = interaction.options.getSubCommand();
        switch (subCommand) {
            case 'commands': {
                const response = await this.responseFactory.fetchCommandResponse(interaction);
                return interaction.followUp(response);
            }
            default: throw interaction;
        }
    }

    public async onSelectMenu(interaction: SelectMenuInteraction, customData: AdminCustomData): Promise<any> {
        if (!this.isAdmin(interaction)) {
            const embed = this.responseFactory.getForbiddenEmbed(interaction, this, 'You must have \`ADMINISTRATOR\` permissions');
            return interaction.reply(embed.toReplyOptions(true));
        }
        await interaction.deferUpdate();
        switch (customData.sub) {
            case 'commands': {
                if (!customData.group) {
                    const group = interaction.values[0] as GuildCommandHandlerGroup;
                    const response = await this.responseFactory.fetchCommandResponse(interaction, group);
                    return interaction.editReply(response);
                } else {
                    const response = await this.responseFactory.fetchCommandResponse(interaction, customData.group, interaction.values);
                    return interaction.editReply(response);
                }
            }
        }
    }

    public async onButton(interaction: ButtonInteraction, customData: AdminCustomData): Promise<any> {
        if (!this.isAdmin(interaction)) {
            const embed = this.responseFactory.getForbiddenEmbed(interaction, this, 'You must have \`ADMINISTRATOR\` permissions');
            return interaction.reply(embed.toReplyOptions(true));
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
                    const response = await this.responseFactory.fetchCommandResponse(interaction, customData.group, handlerIds);
                    return interaction.editReply(response);
                }
            }
        }
    }

    public encodeButton(customData: AdminCustomData): string { return JSON.stringify(customData) }
    public decodeButton(customId: string): AdminCustomData { return JSON.parse(customId) }
    public encodeSelectMenu(customData: AdminCustomData): string { return JSON.stringify(customData) }
    public decodeSelectMenu(customId: string): AdminCustomData { return JSON.parse(customId) }

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
