import { BooruEmbed } from '../BooruEmbed';
import { MessageEmbed } from 'discord.js';

export interface TagLimitEmbedData {
    readonly accountType: string,
    readonly maxTags: string
}

export class TagLimitEmbed extends BooruEmbed {

    constructor(embed: MessageEmbed, data: TagLimitEmbedData) {
        super(embed);
        this.setDescription(`Sorry! You can only search up to \`${data.maxTags}\` tags with a \`${data.accountType}\` account 😦`);
    }
}
