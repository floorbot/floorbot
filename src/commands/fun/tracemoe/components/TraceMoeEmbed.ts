import { Message, MessageEmbed, MessageEmbedOptions, Interaction} from 'discord.js';
import { HandlerEmbed } from '../../../../discord/helpers/components/HandlerEmbed.js';
import { TraceMoeData } from '../api/interfaces/TraceMoeData.js';

export class TraceMoeEmbed extends HandlerEmbed {

    constructor(interaction: Interaction, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(interaction);
    }

    public static getCurrentEmbed(interaction: Interaction, _message: Message, result: TraceMoeData): TraceMoeEmbed {
        const embed = new TraceMoeEmbed(interaction);
        const aniTitle = result.result[0]!.anilist.title.romaji;
        const aniListID = result.result[0]!.anilist.id;
        const episode = result.result[0]!.episode;
        const simularity = (result.result[0]!.similarity * 100).toFixed(2);
        embed.setTitle(`${aniTitle}`);
        embed.setDescription([`There is a ${simularity} percent chance that this comes from episode ${episode} of ${aniTitle}.`,
                              ``].join('\n'));
        embed.setURL(`https://anilist.co/anime/${aniListID}`);
        return embed;
    }
}
