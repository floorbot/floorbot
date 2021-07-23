import { UrbanDictionaryAPI, DefineCommandData, DefineEmbedFactory, GuildHandler, GuildHandlerGroup, DefineButtonFactory, DefinePageButtonType } from '../../..';
import { CommandInteraction, Util, Message, MessageOptions, MessageActionRow, ButtonInteraction } from 'discord.js';
import { HandlerContext, HandlerCustomData } from 'discord.js-commands';

export interface DefineCustomData extends HandlerCustomData {
    readonly query?: string
    readonly page: number
}

export class DefineHandler extends GuildHandler<DefineCustomData> {

    constructor() {
        super({
            id: 'define',
            nsfw: false,
            group: GuildHandlerGroup.FUN,
            commandData: DefineCommandData
        });
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();
        const query = interaction.options.getString('query');
        const response = await this.fetchResponse(interaction, { page: 0, ...(query && { query }) });
        return interaction.followUp(response);
    }

    public override async onButton(interaction: ButtonInteraction, customData: DefineCustomData): Promise<any> {
        const { message } = <{ message: Message }>interaction;
        await interaction.deferUpdate();
        const response = await this.fetchResponse(interaction, customData);
        return message.edit(response);
    }

    private async fetchResponse(context: HandlerContext, defineData: DefineCustomData): Promise<MessageOptions> {
        if (defineData.query) {
            const term = Util.escapeMarkdown(defineData.query);
            const definitions = await UrbanDictionaryAPI.define(term);
            if (!definitions.length) DefineEmbedFactory.getNotFoundEmbed(context, defineData.query).toReplyOptions();
            defineData = { ...defineData, page: defineData.page % definitions.length }
            defineData = { ...defineData, page: defineData.page >= 0 ? defineData.page : definitions.length - 1 }
            const embed = DefineEmbedFactory.getDefinitionEmbed(context, defineData, definitions)
            const actionRow = new MessageActionRow().addComponents([
                DefineButtonFactory.getPageButton(this, DefinePageButtonType.PREVIOUS, defineData),
                DefineButtonFactory.getPageButton(this, DefinePageButtonType.NEXT, defineData)
            ])
            return { embeds: [embed], components: [actionRow] };
        } else {
            const definitions = await UrbanDictionaryAPI.random();
            const embed = DefineEmbedFactory.getDefinitionEmbed(context, defineData, definitions);
            return { embeds: [embed] };
        }
    }
}
