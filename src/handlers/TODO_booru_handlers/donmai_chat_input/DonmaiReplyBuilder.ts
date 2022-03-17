import { EmbedBuilder } from "../../../lib/discord/builders/EmbedBuilder.js";
import { MixinConstructor } from "../../../lib/ts-mixin-extended.js";
import { BooruReplyBuilder } from "../BooruReplyBuilder.js";

export class DonmaiReplyBuilder extends DonmaiReplyMixin(BooruReplyBuilder) { };

export function DonmaiReplyMixin<T extends MixinConstructor<BooruReplyBuilder>>(Builder: T) {
    return class DonmaiReplyBuilder extends Builder {

        protected override createBooruEmbedBuilder(): EmbedBuilder {
            return super.createEmbedBuilder()
                .setFooter({ text: `Powered by Donmai`, iconURL: 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg' });
        }

        public addDonmaiRestrictedTagEmbed(query: string): this {
            const embed = this.createEmbedBuilder()
                .setDescription(`Sorry! The tag \`${query}\` is censored and requires a Gold+ account to view`);
            return this.addEmbed(embed);
        }

        public addDonmaiTagLimitEmbed(accountType: string, maxTags: string): this {
            const embed = this.createEmbedBuilder()
                .setDescription(`Sorry! You can only search up to \`${maxTags}\` tags with a \`${accountType}\` account 😦`);
            return this.addEmbed(embed);
        }

        public addDonmaiTimeoutEmbed(query: string | null): this {
            const embed = this.createEmbedBuilder()
                .setDescription(`Sorry! The database timed out running the query \`${query}\` 😭`);
            return this.addEmbed(embed);
        }

        public addDonmaiUnknownDetailsEmbed(query: string | null, details: string): this {
            const embed = this.createEmbedBuilder()
                .setDescription([
                    `Sorry! I received an unknown response for the query \`${query}\` 😕`,
                    `Message: *${details}*`
                ]);
            return this.addEmbed(embed);
        }
    };
}
