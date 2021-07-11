import { HandlerContext } from 'discord.js-commands';
import { AdminEmbed } from '../AdminEmbed';

export class MissingAdminEmbed extends AdminEmbed {

    constructor(context: HandlerContext, subCommand: string) {
        super(context);
        this.setDescription(`Sorry! you must be an admin to use \`/admin ${subCommand}\`!`);
    }
}
