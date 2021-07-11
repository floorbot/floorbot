import { BooruEmbed } from '../BooruEmbed';
import { MessageEmbed } from 'discord.js';

export class TimeoutEmbed extends BooruEmbed {

    constructor(embed: MessageEmbed, tags: string | null) {
        super(embed);
        this.setDescription(`Sorry! The database timed out running the query \`${tags}\` 😭`);
    }
}
