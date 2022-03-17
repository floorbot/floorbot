import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from "../../lib/builders/ResourceMixins.js";
import { PageableButtonActionRowBuilder } from "../../lib/builders/PageableButtonActionRowBuilder.js";
import { ReplyBuilder } from "../../lib/discord/builders/ReplyBuilder.js";
import { MixinConstructor } from "../../lib/ts-mixin-extended.js";
import { HandlerUtil } from "../../lib/discord/HandlerUtil.js";
import { Util } from "discord.js";

export interface RollData {
    rollString: string,
    rollCount: number,
    rolls: number[],
    total: number,
    dice: number;
}

export class RollReplyBuilder extends RollReplyMixin(ReplyBuilder) { };

export function RollReplyMixin<T extends MixinConstructor<ReplyBuilder>>(Builder: T) {
    return class RollReplyBuilder extends Builder {

        public addMaxRollsEmbed(actualRolls: number, maxRolls: number): this {
            const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.FROWN);
            const embed = this.createEmbedBuilder()
                .setThumbnail(attachment.getEmbedUrl())
                .setDescription([
                    `Sorry! You can only roll up to \`${HandlerUtil.formatCommas(maxRolls)}\` dice!`,
                    `*You attempted to roll \`${HandlerUtil.formatCommas(actualRolls)}\` dice!*`
                ]);
            this.addEmbed(embed);
            this.addFile(attachment);
            return this;
        }

        public addRollEmbed(rollData: RollData[], page: number): this {
            page = page % rollData.length;
            page = page >= 0 ? page : rollData.length + page;
            const rollsString = Util.splitMessage(
                rollData[page]!.rolls.map(roll => HandlerUtil.formatCommas(roll)).join(', '),
                { maxLength: 1024, append: '...', char: ', ' }
            )[0];
            const allTotal = rollData.reduce((total, data) => total + data.total, 0);
            const allFails = rollData.reduce((total, data) => !data.total ? total + 1 : total, 0);
            const embed = this.createEmbedBuilder()
                .setTitle(`${rollData[page]!.rollString} ${rollData[page]!.total ? '' : '(Invalid)'}`)
                .setDescription(rollData[page]!.total ?
                    `${rollsString} \`Total: ${rollData[page]!.total}\`` :
                    '*Please check the format of your dice (1d6 or 6D9...)*'
                )
                .setFooter({ text: `Roll: ${page + 1}/${rollData.length} - Total: ${HandlerUtil.formatCommas(allTotal)} - Failed: ${HandlerUtil.formatCommas(allFails)}` });
            return this.addEmbed(embed);
        }

        public addRollPageActionRow(rollData: RollData[]): this {
            const actionRow = new PageableButtonActionRowBuilder()
                .addPreviousPageButton(undefined, rollData.length <= 1)
                .addNextPageButton(undefined, rollData.length <= 1);
            return this.addActionRow(actionRow);
        }
    };
}
