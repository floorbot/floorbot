import { InteractionReplyOptions, Interaction, Message, CacheType, CommandInteraction, Util, MessageActionRow } from 'discord.js';
import { HandlerButton } from '../../../lib/discord/helpers/components/HandlerButton.js';
import { HandlerReplies } from '../../../lib/discord/helpers/HandlerReplies.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';

export interface RollData {
    rollString: string,
    rollCount: number,
    rolls: number[],
    total: number,
    dice: number;
}

export class RollReplies extends HandlerReplies {

    public createMaxRollsReply(context: Interaction | Message, actualRolls: number, maxRolls: number): InteractionReplyOptions {
        const attachment = this.getAvatar('1-3');
        return this.createEmbedTemplate(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! You can only roll up to \`${HandlerUtil.formatCommas(maxRolls)}\` dice!`,
                `*You attempted to roll \`${HandlerUtil.formatCommas(actualRolls)}\` dice!*`
            ])
            .toReplyOptions({ files: [attachment] });
    }

    public createRollsReply(command: CommandInteraction<CacheType>, rollData: RollData[], page: number): InteractionReplyOptions {
        page = page % rollData.length;
        page = page >= 0 ? page : rollData.length + page;
        const rollsString = Util.splitMessage(
            rollData[page]!.rolls.map(roll => HandlerUtil.formatCommas(roll)).join(', '),
            { maxLength: 1024, append: '...', char: ', ' }
        )[0];
        const allTotal = rollData.reduce((total, data) => total + data.total, 0);
        const allFails = rollData.reduce((total, data) => !data.total ? total + 1 : total, 0);
        const embed = this.createEmbedTemplate(command)
            .setTitle(`${rollData[page]!.rollString} ${rollData[page]!.total ? '' : '(Invalid)'}`)
            .setDescription(rollData[page]!.total ?
                `${rollsString} \`Total: ${rollData[page]!.total}\`` :
                '*Please check the format of your dice (1d6 or 6D9...)*'
            )
            .setFooter(`Roll: ${page + 1}/${rollData.length} - Total: ${HandlerUtil.formatCommas(allTotal)} - Failed: ${HandlerUtil.formatCommas(allFails)}`);

        const actionRow = new MessageActionRow().addComponents([
            HandlerButton.createPreviousPageButton(),
            HandlerButton.createNextPageButton()
        ]);

        return { embeds: [embed], ...(rollData.length > 1 && { components: [actionRow] }) };
    }
}
