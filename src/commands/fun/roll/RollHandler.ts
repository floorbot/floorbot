import { ChatInputHandler } from '../../../lib/discord/handlers/abstracts/ChatInputHandler.js';
import { HandlerButtonID } from '../../../lib/discord/helpers/components/HandlerButton.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import { RollData, RollReplies } from './RollReplies.js';
import { CommandInteraction, Message } from 'discord.js';
import { RollCommandData } from './RollCommandData.js';

export class RollHandler extends ChatInputHandler {

    private static readonly MAX_ROLLS = 100000;

    private readonly replies: RollReplies;

    constructor() {
        super({ group: 'Fun', global: false, nsfw: false, data: RollCommandData });
        this.replies = new RollReplies();
    }

    public async execute(command: CommandInteraction): Promise<any> {
        await command.deferReply();
        const query = command.options.getString('dice') || '1d6';
        const rollStrings = query.split(' ');
        const rollables = rollStrings.map(rollString => {
            const matches = /(\d+)?d(\d+)/gi.exec(rollString);
            return {
                rollString: rollString,
                rollCount: matches ? (Number(matches[1]) || 1) : 0,
                dice: matches ? Number(matches[2]) : 0
            };
        });

        const totalRolls = rollables.reduce((total, rollable) => total + rollable.rollCount, 0);
        if (totalRolls > RollHandler.MAX_ROLLS) {
            const replyOptions = this.replies.createMaxRollsReply(command, totalRolls, RollHandler.MAX_ROLLS);
            return command.followUp(replyOptions);
        }

        let page = 0;
        const rollData = rollables.map(rollable => this.rollDice(rollable));
        const replyOptions = this.replies.createRollsReply(command, rollData, page);
        const message = await command.followUp(replyOptions) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
            await component.deferUpdate();
            if (component.customId === HandlerButtonID.NEXT_PAGE) page++;
            if (component.customId === HandlerButtonID.PREVIOUS_PAGE) page--;
            const replyOptions = this.replies.createRollsReply(command, rollData, page);
            await component.editReply(replyOptions);
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    private rollDice(rollables: { rollString: string, rollCount: number, dice: number; }): RollData {
        const rolls = [...Array(rollables.rollCount)].map(() => Math.ceil(Math.random() * Math.ceil(rollables.dice)));
        const total = rolls.reduce((total, roll) => total + roll, 0);
        return { ...rollables, rolls, total };
    }
}
