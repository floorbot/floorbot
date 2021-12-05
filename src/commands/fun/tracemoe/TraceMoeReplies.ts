import { TraceMoeData } from "../../../apis/tracemoe/interfaces/TraceMoeData.js";
import { HandlerReplies } from "../../../discord/helpers/HandlerReplies.js";
import { HandlerEmbed } from '../../../discord/helpers/components/HandlerEmbed.js';
import { HandlerButton } from '../../../discord/helpers/components/HandlerButton.js';
import { Interaction, InteractionReplyOptions, Message, MessageActionRow } from "discord.js";

export class TraceMoeReplies extends HandlerReplies {

    public override createEmbedTemplate(context: Interaction | Message, pageData?: { page: number, pages: number }): HandlerEmbed {
        const embed = super.createEmbedTemplate(context)
        if (pageData) embed.setFooter(`${pageData.page}/${pageData.pages} - Powered by Trace Moe`);
        else embed.setFooter(`Powered by Trace Moe`)
        return embed
    }

    public createCurrentReply(context: Interaction | Message, results: TraceMoeData[], page: number = 0): InteractionReplyOptions {
        const result = results[page]!;
        if (!result) throw { result, page };
        const aniTitle = result.anilist.title.romaji;
        const aniListID = result.anilist.id;
        const episode = result.episode;
        const simularity = (result.similarity * 100).toFixed(2);
        const embed = this.createEmbedTemplate(context, { page: page + 1, pages: results.length })
            .setTitle(`${aniTitle}`)
            .setDescription(`There is a ${simularity} percent chance that this comes from episode ${episode} of ${aniTitle}.`)
            .setURL(`https://anilist.co/anime/${aniListID}`);
        const actionRow = new MessageActionRow().addComponents([
            HandlerButton.createPreviousPageButton(),
            HandlerButton.createNextPageButton(),
        ]);
        return { embeds: [embed], components: [actionRow] };
    }
}
