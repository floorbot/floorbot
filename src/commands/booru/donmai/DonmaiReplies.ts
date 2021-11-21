import { Interaction, InteractionReplyOptions, Message } from 'discord.js';
import { BooruReplies } from '../BooruReplies.js';

export interface BooruReplyConstructorOptions {
    readonly apiName: string,
    readonly apiIcon: string
}

export class DonmaiReplies extends BooruReplies {

    constructor(options: BooruReplyConstructorOptions) {
        super(options);
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
