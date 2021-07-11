import { HandlerContext } from 'discord.js-commands';
import { MarkovEmbed } from '../MarkovEmbed';
import { GuildChannel } from 'discord.js';

export class ConfirmEmbed extends MarkovEmbed {

    constructor(context: HandlerContext, action: 'enable' | 'disable' | 'wipe' | 'purge', channel: GuildChannel) {
        super(context);
        switch (action) {
            case 'enable': {
                this.setDescription([
                    `⚠️ By enabling markv for ${channel} you are allowing it to:`,
                    `- *Store message content from ${channel}*`,
                    `- *Randomly post generated messages to ${channel}*`,
                    `- *Keep and use saved message history for ${channel}*`,
                    'ᅟᅟ- *Using \`Enable and Wipe\` will require confirmation* '
                ].join('\n'))
                break;
            }
            case 'disable': {
                this.setDescription([
                    `⚠️ By disabling markv for ${channel} you are confirming it will:`,
                    `- *Stop randomly posting generated messages to ${channel}*`,
                    `- *Keep all saved message history for ${channel}*`,
                    'ᅟᅟ- *Using \`Disable and Wipe\` will require confirmation* '
                ].join('\n'))
                break;
            }
            case 'wipe': {
                this.setDescription([
                    `⚠️ By wiping data for ${channel} you are confirming it will:`,
                    `- *Delete all saved message history for ${channel}*`,
                    `- *Continue to store/post new messages from ${channel} if it is enabled*`,
                    `ᅟᅟ- *Following up with \`/markov disable\` will prevent this*`
                ].join('\n'))
                break;
            }
            case 'purge': {
                this.setDescription([
                    '⚠️ Before you can disable markov all saved data must be purged',
                    '⛔ This is irreversible and will hard reset all markov settings for this guild'
                ].join('\n'))
                break;
            }
            default: { throw action }
        }
    }
}
