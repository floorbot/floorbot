import { HandlerContext } from 'discord.js-commands';
import { MarkovEmbed } from '../MarkovEmbed';
import { GuildChannel } from 'discord.js';

export interface StatusEmbedData {
    readonly channel: GuildChannel,
    readonly frequency: number,
    readonly enabled: boolean,
    readonly message: string,
    readonly total: number,
    readonly wipe?: boolean,
}

export class StatusEmbed extends MarkovEmbed {

    constructor(context: HandlerContext, options: StatusEmbedData) {
        super(context);
        this.setDescription([
            `${options.message}`,
            '',
            `channel: **${options.channel}**`,
            `status: **${options.enabled ? 'enabled' : 'disabled'}**`,
            `frequency: **1 in ${options.frequency} messages**`,
            `stored data: **${options.total} messages**`,
            '',
            ...(options.wipe ? [
                `⚠️ Please confirm you want to wipe all saved message data for ${options.channel}?`,
                'ᅟᅟ- *Note this is a permanent and cannot be undone*'
            ] : [])
        ].join('\n'));
    }
}
