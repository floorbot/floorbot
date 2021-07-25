import { UrbanDictionaryAPI, DefineCommandData, GuildHandler, GuildHandlerGroup, DefineButtonFactory, DefineEmbedFactory } from '../../..';
import { CommandInteraction, Util, Message, MessageOptions, MessageActionRow, ButtonInteraction } from 'discord.js';
import { HandlerContext, HandlerCustomData, HandlerEmbed } from 'discord.js-commands';

export interface DefineCustomData extends HandlerCustomData {
    readonly query?: string
    readonly page: number
}

export class DefineHandler extends GuildHandler<DefineCustomData> {

    constructor() {
        super({ id: 'define', commandData: DefineCommandData, group: GuildHandlerGroup.FUN });
    }

    public override async onCommand(interaction: CommandInteraction): Promise<any> {
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

    public override getEmbedTemplate(context: HandlerContext, _customData?: DefineCustomData): HandlerEmbed {
        return super.getEmbedTemplate(context)
            .setFooter('Powered by Urban Dictionary', 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg');
    }

    private async fetchResponse(context: HandlerContext, customData: DefineCustomData): Promise<MessageOptions> {
        if (customData.query) {
            const term = Util.escapeMarkdown(customData.query);
            const definitions = await UrbanDictionaryAPI.define(term);
            if (!definitions.length) this.getNotFoundResponse(context, term);
            customData = { ...customData, page: customData.page % definitions.length }
            customData = { ...customData, page: customData.page >= 0 ? customData.page : definitions.length - 1 }
            const page = customData.page % definitions.length;
            const embed = DefineEmbedFactory.getDefinitionEmbed(this, context, definitions, page);
            const actionRow = new MessageActionRow().addComponents([
                DefineButtonFactory.getPreviousPageButton(this, customData.query!, page),
                DefineButtonFactory.getNextPageButton(this, customData.query!, page)
            ])
            return { embeds: [embed], components: [actionRow] };
        } else {
            const definitions = await UrbanDictionaryAPI.random();
            const embed = DefineEmbedFactory.getDefinitionEmbed(this, context, definitions[0]!);
            return { embeds: [embed] };
        }
    }
}
