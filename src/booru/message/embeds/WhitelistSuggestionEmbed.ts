import { BooruHandler } from '../../BooruHandler';
import { BooruEmbed } from '../BooruEmbed';
import { MessageEmbed } from 'discord.js';

export class WhitelistSuggestionEmbed extends BooruEmbed {

    constructor(embed: MessageEmbed, handler: BooruHandler) {
        super(embed);
        this.setDescription(`Sorry! You do not have permission to descide on a suggestion 😭\n` + `*Please use \`/${handler.id}\` to make your own!*`)
    }
}
