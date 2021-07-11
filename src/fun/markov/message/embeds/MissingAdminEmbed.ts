import { HandlerContext } from 'discord.js-commands';
import { MarkovEmbed } from '../MarkovEmbed';

export class MissingAdminEmbed extends MarkovEmbed {

    constructor(context: HandlerContext, subCommand: string) {
        super(context);
        this.setDescription(`Sorry! you must be an admin to use \`/markov ${subCommand}\`!`);
    }
}
