import { TraceMoeData } from "../../../apis/tracemoe/interfaces/TraceMoeData.js";
import { HandlerReplies } from "../../../discord/helpers/HandlerReplies.js";
import { Interaction, InteractionReplyOptions, Message } from "discord.js";

export class TraceMoeReplies extends HandlerReplies {

    public createCurrentReply(context: Interaction | Message, result: TraceMoeData): InteractionReplyOptions {
        const embed = this.createEmbedTemplate(context)
        const aniTitle = result.result[0]!.anilist.title.romaji;
        const aniListID = result.result[0]!.anilist.id;
        const episode = result.result[0]!.episode;
        const simularity = (result.result[0]!.similarity * 100).toFixed(2);
        embed.setTitle(`${aniTitle}`);
        embed.setDescription(`There is a ${simularity} percent chance that this comes from episode ${episode} of ${aniTitle}.`);
        embed.setURL(`https://anilist.co/anime/${aniListID}`);
        return { embeds: [embed] };
    }
}