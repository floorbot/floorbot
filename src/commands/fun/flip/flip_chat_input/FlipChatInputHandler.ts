import { ChatInputHandler } from '../../../../discord/handlers/abstracts/ChatInputHandler.js';
import { HandlerEmbed } from '../../../../discord/helpers/components/HandlerEmbed.js';
import { FlipChatInputCommandData } from './FlipChatInputCommandData.js';
import { HandlerUtil } from '../../../../discord/HandlerUtil.js';
import { CommandInteraction, Util } from 'discord.js';
import { Flipper } from '../Flipper.js';

export class FlipChatInputHandler extends ChatInputHandler {

    constructor() {
        super({ group: 'Fun', global: false, nsfw: false, data: FlipChatInputCommandData });
    }

    public async execute(command: CommandInteraction): Promise<any> {
        await command.deferReply();
        const value = command.options.getString('value') || '1';
        const count = parseInt(value);
        if (count) {
            const heads = Math.round(this.random_bm() * count);
            const embed = new HandlerEmbed()
                .setContextAuthor(command)
                .setTitle(`You flipped ${HandlerUtil.formatCommas(count)} coin${count > 1 ? 's' : ''}`)
                .addField('Heads', HandlerUtil.formatCommas(heads), true)
                .addField('Tails', HandlerUtil.formatCommas(count - heads), true);
            return command.followUp(embed.toReplyOptions());
        } else {
            const flipped = Flipper.flipText(value);
            const split = Util.splitMessage(flipped, { maxLength: 2000 })[0]!
            return command.followUp({ content: split, allowedMentions: { parse: [] } });
        }
    }

    // Standard Normal variate using Box-Muller transform.
    private random_bm() {
        let u = 0;
        let v = 0;
        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = Math.random(); //Converting [0,1) to (0,1)
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return num / 10.0 + 0.5;
    }
}
