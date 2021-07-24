import { UrbanDictionaryAPI, DefineCommandData, DefineEmbedFactory, GuildCommandHandler, DefineButtonFactory, DefinePageButtonType, GuildCommandHandlerGroup } from '../../..';
import { CommandInteraction, Util, Message, MessageOptions, MessageActionRow, ButtonInteraction } from 'discord.js';
import { HandlerCustomData, HandlerContext } from 'discord.js-commands';

export interface DefineCustomData extends HandlerCustomData {
    readonly query?: string
    readonly page: number
}

export class DefineHandler extends GuildCommandHandler {

    public readonly buttonFactory: DefineButtonFactory
    public readonly embedFactory: DefineEmbedFactory

    constructor() {
        super({ id: 'define', group: GuildCommandHandlerGroup.FUN, commandData: DefineCommandData });
        this.buttonFactory = new DefineButtonFactory(this);
        this.embedFactory = new DefineEmbedFactory(this);
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();
        const query = interaction.options.getString('query');
        const response = await this.fetchResponse(interaction, { page: 0, ...(query && { query }) });
        return interaction.followUp(response);
    }

    public async onButton(interaction: ButtonInteraction, customData: DefineCustomData): Promise<any> {
        const { message } = <{ message: Message }>interaction;
        await interaction.deferUpdate();
        const response = await this.fetchResponse(interaction, customData);
        return message.edit(response);
    }

    public async fetchResponse(context: HandlerContext, defineData: DefineCustomData): Promise<MessageOptions> {
        if (defineData.query) {
            const term = Util.escapeMarkdown(defineData.query);
            const definitions = await UrbanDictionaryAPI.define(term);
            if (!definitions.length) this.embedFactory.getNotFoundEmbed(context, defineData.query).toReplyOptions();
            defineData = { ...defineData, page: defineData.page % definitions.length }
            defineData = { ...defineData, page: defineData.page >= 0 ? defineData.page : definitions.length - 1 }
            const embed = this.embedFactory.getDefinitionEmbed(context, defineData, definitions)
            const actionRow = new MessageActionRow().addComponents([
                this.buttonFactory.getPageButton(DefinePageButtonType.PREVIOUS, defineData),
                this.buttonFactory.getPageButton(DefinePageButtonType.NEXT, defineData)
            ])
            return { embeds: [embed], components: [actionRow] };
        } else {
            const definitions = await UrbanDictionaryAPI.random();
            const embed = this.embedFactory.getDefinitionEmbed(context, defineData, definitions);
            return embed.toReplyOptions();
        }
    }
}
