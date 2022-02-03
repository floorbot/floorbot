import { ChatInputApplicationCommandData, CommandInteraction, Message } from "discord.js";
import { ComponentID } from "../../lib/discord/builders/ActionRowBuilder.js";
import { RollChatInputCommandData } from "./RollChatInputCommandData.js";
import { ApplicationCommandHandler } from "discord.js-handlers";
import { HandlerUtil } from "../../lib/discord/HandlerUtil.js";
import { RollData, RollReplyBuilder } from "./RollMixins.js";

export class RollChatInputHandler extends ApplicationCommandHandler<ChatInputApplicationCommandData> {

    private static readonly MAX_ROLLS = 100000;

    constructor() {
        super(RollChatInputCommandData);
    }

    public async run(command: CommandInteraction): Promise<void> {
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
        if (totalRolls > RollChatInputHandler.MAX_ROLLS) {
            const embed = new RollReplyBuilder(command)
                .addMaxRollsEmbed(totalRolls, RollChatInputHandler.MAX_ROLLS);
            await command.followUp(embed);
        }

        let page = 0;
        const rollData = rollables.map(rollable => this.rollDice(rollable));
        const embed = new RollReplyBuilder(command)
            .addRollEmbed(rollData, page);
        rollData.length > 1 && embed.addRollPageActionRow(rollData);
        const message = await command.followUp(embed) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
            await component.deferUpdate();
            if (component.customId === ComponentID.NEXT_PAGE) page++;
            if (component.customId === ComponentID.PREVIOUS_PAGE) page--;
            const embed = new RollReplyBuilder(command)
                .addRollEmbed(rollData, page);
            rollData.length > 1 && embed.addRollPageActionRow(rollData);
            await component.editReply(embed);
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    private rollDice(rollables: { rollString: string, rollCount: number, dice: number; }): RollData {
        const rolls = [...Array(rollables.rollCount)].map(() => Math.ceil(Math.random() * Math.ceil(rollables.dice)));
        const total = rolls.reduce((total, roll) => total + roll, 0);
        return { ...rollables, rolls, total };
    }
}
