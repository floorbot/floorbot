import { BooruEmbed } from '../BooruEmbed';
import { MessageEmbed } from 'discord.js';

export class ErrorEmbed extends BooruEmbed {

    constructor(embed: MessageEmbed, message: string) {
        super(embed);
        this.setDescription(`Sorry! I'm not sure how to handle this error 😭\n\`${message}\``)
    }
}
