import { BooruReplies, BooruReplyConstructorOptions } from '../BooruReplies.js';
import { Interaction, InteractionReplyOptions, Message } from 'discord.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';

export class DonmaiReplies extends BooruReplies {

    constructor(subDomain: string, options?: BooruReplyConstructorOptions) {
        super(options ? options : {
            apiName: HandlerUtil.capitalizeString(subDomain),
            apiIcon: 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg'
        });
    }

    public createRestrictedTagReply(context: Interaction | Message, tag: string): InteractionReplyOptions {
        return this.createEmbedTemplate(context)
            .setDescription(`Sorry! The tag \`${tag}\` is censored and requires a Gold+ account to view`)
            .toReplyOptions();
    }

    public createTagLimitReply(context: Interaction | Message, accountType: string, maxTags: string): InteractionReplyOptions {
        return this.createEmbedTemplate(context)
            .setDescription(`Sorry! You can only search up to \`${maxTags}\` tags with a \`${accountType}\` account 😦`)
            .toReplyOptions();
    }

    public createTimeoutReply(context: Interaction | Message, tags: string | null): InteractionReplyOptions {
        return this.createEmbedTemplate(context)
            .setDescription(`Sorry! The database timed out running the query \`${tags}\` 😭`)
            .toReplyOptions();
    }

    public createUnknownDetailsReply(context: Interaction | Message, tags: string | null, details: string): InteractionReplyOptions {
        return this.createEmbedTemplate(context)
            .setDescription([
                `Sorry! I recieved an unknown response for the query \`${tags}\` 😕`,
                `Message: *${details}*`
            ])
            .toReplyOptions();
    }
}
