import { HandlerContext } from 'discord.js-commands';
import { MarkovEmbed } from '../MarkovEmbed';

export class PurgedEmbed extends MarkovEmbed {

    constructor(context: HandlerContext) {
        super(context);
        this.setDescription(`🦺 You can now safely disable markov!`);
    }
}
