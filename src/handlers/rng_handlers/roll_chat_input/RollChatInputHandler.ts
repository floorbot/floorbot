import { PageableComponentID } from "../../../lib/builders/PageableButtonActionRowBuilder.js";
import { RollChatInputCommandData } from "./RollChatInputCommandData.js";
import { HandlerUtil } from "../../../lib/discord/HandlerUtil.js";
import { DiscordUtil } from '../../../lib/discord/DiscordUtil.js';
import { ChatInputCommandHandler } from "discord.js-handlers";
import { ChatInputCommandInteraction } from "discord.js";
import { RollReplyBuilder } from "./RollReplyBuilder.js";
import { Pageable } from '../../../lib/Pageable.js';

export interface DiceRollable {
    readonly rollString: string,
    readonly count: number,
    readonly dice: number;
}

export interface DiceRolled extends DiceRollable {
    readonly rolls: number[],
    readonly total: number;
}

export class RollChatInputHandler extends ChatInputCommandHandler {

    private static readonly MAX_ROLLS = 100000;

    constructor() {
        super(RollChatInputCommandData);
    }

    public async run(command: ChatInputCommandInteraction): Promise<void> {
        await command.deferReply();

        // Convert input to rollable dice
        const query = command.options.getString('dice') || '1d6';
        const rollStrings = query.split(' ');
        const rollables = rollStrings.map(rollString => {
            const matches = /(?:\s|^)(\d+)?(?:[dD])(\d+)/gi.exec(rollString);
            return {
                rollString: rollString,
                count: matches ? (Number(matches[1]) || 1) : 0,
                dice: matches ? Number(matches[2]) : 0
            };
        });

        // Validate dice
        const unrollables = rollables.filter(rollable => !rollable.count && !rollable.dice);
        if (unrollables.length) {
            const embed = new RollReplyBuilder(command)
                .addUnrollablesEmbed(unrollables);
            return await command.followUp(embed) && undefined;
        }

        // Check total roll count
        const totalRolls = rollables.reduce((total, rollable) => total + rollable.count, 0);
        if (totalRolls > RollChatInputHandler.MAX_ROLLS) {
            const embed = new RollReplyBuilder(command)
                .addMaxRollsEmbed(totalRolls, RollChatInputHandler.MAX_ROLLS);
            return await command.followUp(embed) && undefined;
        }
        const rolled = rollables.map(rollable => this.rollDice(rollable));

        // This should always be the case...
        if (Pageable.isNonEmptyArray(rolled)) {
            const pageable = new Pageable(rolled);
            const replyOptions = new RollReplyBuilder(command)
                .addRolledEmbed(pageable);
            if (pageable.totalPages > 1) replyOptions.addRolledActionRow();

            const message = await command.followUp(replyOptions);
            const collector = DiscordUtil.createComponentCollector(command.client, message);
            collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
                if (component.customId === PageableComponentID.NEXT_PAGE) pageable.page++;
                if (component.customId === PageableComponentID.PREVIOUS_PAGE) pageable.page--;
                const replyOptions = new RollReplyBuilder(command)
                    .addRolledEmbed(pageable);
                if (pageable.totalPages > 1) replyOptions.addRolledActionRow();
                await component.update(replyOptions);
            }));
        }
    }

    private rollDice(rollables: DiceRollable): DiceRolled {
        const rolls = [...Array(rollables.count)].map(() => Math.ceil(Math.random() * Math.ceil(rollables.dice)));
        const total = rolls.reduce((total, roll) => total + roll, 0);
        return { ...rollables, rolls, total };
    }
}
