import { TraceMoeData } from "../../../apis/tracemoe/interfaces/TraceMoeData.js";
import { HandlerReplies } from "../../../discord/helpers/HandlerReplies.js";
import { HandlerEmbed } from '../../../discord/helpers/components/HandlerEmbed.js';
import { HandlerButton } from '../../../discord/helpers/components/HandlerButton.js';
import { Interaction, InteractionReplyOptions, Message, MessageActionRow } from "discord.js";
import urlExist from 'url-exist';
import humanizeDuration from 'humanize-duration';

export class TraceMoeReplies extends HandlerReplies {

    public override createEmbedTemplate(context: Interaction | Message, pageData?: { page: number, pages: number }): HandlerEmbed {
        const embed = super.createEmbedTemplate(context)
        if (pageData) embed.setFooter(`${pageData.page}/${pageData.pages} - Powered by Trace Moe`);
        else embed.setFooter(`Powered by Trace Moe`)
        return embed
    }

    public async createCurrentReply(context: Interaction | Message, results: TraceMoeData[], page: number = 0): Promise<InteractionReplyOptions> {
        const result = results[page]!;
        if (!result) throw { result, page };
        console.log(result);
        const aniTitle = result.anilist.title.romaji;
        const aniListID = result.anilist.id;
        const episode = result.episode;
        const similarity = (result.similarity * 100).toFixed(2);
        const from = humanizeDuration(Math.round(result.from) * 1000);
        const embed = this.createEmbedTemplate(context, { page: page + 1, pages: results.length })
            .setTitle(`${aniTitle}`)
        //Only add fields if data exists
        if(episode)     embed.addField('Episode: ', `${episode}`)
        if(from)        embed.addField('Time: ', `${from}`)
        if(similarity)  embed.addField('Similarity: ', `${similarity}%`)
        const aniListURL = `https://anilist.co/anime/${aniListID}`;
        //Create attachment of video. Use "l" in size parameter for large video
        const attachment = this.createAttachmentTemplate(`${result.video}&size=l`);
        const actionRow = new MessageActionRow().addComponents([
            HandlerButton.createPreviousPageButton(),
            HandlerButton.createNextPageButton(),
        ]);
        //Verify anilist link works
        const exists = await urlExist(aniListURL);
        if (exists) embed.setURL(aniListURL);
        return { embeds: [embed], components: [actionRow], attachments: [], files: [attachment] };
    }
}
