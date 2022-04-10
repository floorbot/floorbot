import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from "../../../../lib/builders/ResourceMixins.js";
import { PageableButtonActionRowBuilder } from "../../../../lib/builders/PageableButtonActionRowBuilder.js";
import { ReplyBuilder } from "../../../../lib/discord/builders/ReplyBuilder.js";
import { MixinConstructor } from "../../../../lib/ts-mixin-extended.js";
import { DiceRollable, DiceRolled } from './RollChatInputHandler.js';
import { DiscordUtil } from '../../../../lib/discord/DiscordUtil.js';
import { Pageable } from '../../../../lib/Pageable.js';


export class RollReplyBuilder extends RollReplyMixin(ReplyBuilder) { };

export function RollReplyMixin<T extends MixinConstructor<ReplyBuilder>>(Builder: T) {
    return class RollReplyBuilder extends Builder {

        public addUnrollablesEmbed(unrollables: DiceRollable[]): this {
            const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.FROWN);
            const embed = this.createEmbedBuilder()
                .setThumbnail(attachment.getEmbedUrl())
                .setDescription([
                    'Sorry! I am unable to validate the following dice:',
                    unrollables.map(unrollable => `\`${unrollable.rollString}\``).join(' ')
                ]);
            this.addEmbed(embed);
            this.addFile(attachment);
            return this;
        }

        public addMaxRollsEmbed(actualRolls: number, maxRolls: number): this {
            const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.FROWN);
            const embed = this.createEmbedBuilder()
                .setThumbnail(attachment.getEmbedUrl())
                .setDescription([
                    `Sorry! You can only roll up to \`${DiscordUtil.formatCommas(maxRolls)}\` dice!`,
                    `*You attempted to roll \`${DiscordUtil.formatCommas(actualRolls)}\` dice!*`
                ]);
            this.addEmbed(embed);
            this.addFile(attachment);
            return this;
        }

        public addRolledEmbed(rolled: Pageable<DiceRolled>): this {
            const roll = rolled.getPageFirst();
            const rollsString = DiscordUtil.shortenMessage(
                roll.rolls.map(roll => DiscordUtil.formatCommas(roll)).join(', '),
                { maxLength: 1024, append: '...', char: ', ' }
            );
            const allTotal = rolled.array.reduce((total, data) => total + data.total, 0);
            const embed = this.createEmbedBuilder()
                .setTitle(`${roll.rollString}`)
                .setDescription(`${rollsString} \`Total: ${roll.total}\``)
                .setFooter({ text: `Roll: ${rolled.currentPage + 1}/${rolled.totalPages} - Total: ${DiscordUtil.formatCommas(allTotal)}` });
            return this.addEmbed(embed);
        }

        public addRolledActionRow(): this {
            const actionRow = new PageableButtonActionRowBuilder()
                .addPreviousPageButton()
                .addNextPageButton();
            return this.addActionRow(actionRow);
        }
    };
}
