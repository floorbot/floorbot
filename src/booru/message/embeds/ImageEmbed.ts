import { MessageEmbed, Util } from 'discord.js';
import { BooruEmbed } from '../BooruEmbed';

export interface ImageEmbedData {
    tags: string | null,
    imageURL: string,
    postURL: string,
    score: number | null
}

export class ImageEmbed extends BooruEmbed {

    constructor(embed: MessageEmbed, data: ImageEmbedData) {
        super(embed);

        const escapedTags = data.tags ? Util.escapeMarkdown(data.tags).replace(/\+/g, ' ') : String();

        this.setImage(data.imageURL)
        this.setDescription(
            (data.tags ? `**[${escapedTags}](${data.postURL})** ` : '') + `\`score: ${data.score ?? 0}\`` +
            (/\.swf$/.test(data.imageURL) ? `\n\nSorry! This is a flash file 🙃\n*click the [link](${data.postURL}) to view in browser*` : '')
        )
    }
}
