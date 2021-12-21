import { BuilderContext } from '../../../lib/discord/builders/BuilderInterfaces.js';
import { BooruAPIData, BooruReplyBuilder } from '../BooruReplyBuilder.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';

export class DonmaiReplyBuilder extends BooruReplyBuilder {

    constructor(data: BuilderContext, subDomain: string, options?: BooruAPIData) {
        super(data, options ? options : {
            apiName: HandlerUtil.capitalizeString(subDomain),
            apiIcon: 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg'
        });
    }

    public addDonmaiRestrictedTagEmbed(tag: string): this {
        const embed = this.createEmbedBuilder()
            .setDescription(`Sorry! The tag \`${tag}\` is censored and requires a Gold+ account to view`);
        return this.addEmbed(embed);
    }

    public addDonmaiTagLimitEmbed(accountType: string, maxTags: string): this {
        const embed = this.createEmbedBuilder()
            .setDescription(`Sorry! You can only search up to \`${maxTags}\` tags with a \`${accountType}\` account 😦`);
        return this.addEmbed(embed);
    }

    public addDonmaiTimeoutEmbed(tags: string | null): this {
        const embed = this.createEmbedBuilder()
            .setDescription(`Sorry! The database timed out running the query \`${tags}\` 😭`);
        return this.addEmbed(embed);
    }

    public addDonmaiUnknownDetailsEmbed(tags: string | null, details: string): this {
        const embed = this.createEmbedBuilder()
            .setDescription([
                `Sorry! I received an unknown response for the query \`${tags}\` 😕`,
                `Message: *${details}*`
            ]);
        return this.addEmbed(embed);
    }
}
