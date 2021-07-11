import { HandlerContext } from 'discord.js-commands';
import { MarkovEmbed } from '../MarkovEmbed';
import { Channel, User } from 'discord.js';

export class FailedEmbed extends MarkovEmbed {

    constructor(context: HandlerContext, channel: Channel, user: User | null) {
        super(context);
        this.setDescription([
            `Sorry! I failed to genereate a message for ${channel}${user ? `/${user}` : ''}`,
            '',
            'This could be for the folllowing reasons:',
            ` - *Not enough saved history for this ${channel}${user ? `/${user}` : ''}*`,
            ' - *An unexpected error occured during generation*',
            ' - *Unlucky*',
            '',
            '*Please continue to use this channel and try again later*'
        ].join('\n'))
    }
}
