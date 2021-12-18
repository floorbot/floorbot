import { ChatInputHandler } from '../../../../lib/discord/handlers/abstracts/ChatInputHandler.js';
import { HandlerEmbed } from '../../../../lib/discord/helpers/components/HandlerEmbed.js';
import { FlipChatInputCommandData } from './FlipChatInputCommandData.js';
import { HandlerUtil } from '../../../../lib/discord/HandlerUtil.js';
import { CommandInteraction, Util } from 'discord.js';
import { Flipper } from '../Flipper.js';

export class FlipChatInputHandler extends ChatInputHandler {

    public static readonly MAX_COINS = 100000;

    constructor() {
        super({ group: 'Fun', global: false, nsfw: false, data: FlipChatInputCommandData });
    }

    public async execute(command: CommandInteraction): Promise<any> {
        await command.deferReply();
        const value = command.options.getString('value') || '1';
        let count = Math.min(parseInt(value) || 0, FlipChatInputHandler.MAX_COINS);
        if (count) {
            let heads = 0;
            for (let i = 0; i < count; i++) { if (Math.round(Math.random())) heads++; }
            const embed = new HandlerEmbed()
                .setContextAuthor(command)
                .setTitle(`You flipped ${HandlerUtil.formatCommas(count)} coin${count > 1 ? 's' : ''}`)
                .addField('Heads', HandlerUtil.formatCommas(heads), true)
                .addField('Tails', HandlerUtil.formatCommas(count - heads), true);
            return command.followUp(embed.toReplyOptions());
        } else {
            const flipped = Flipper.flipText(value);
            const split = Util.splitMessage(flipped, { maxLength: 2000 })[0]!;
            return command.followUp({ content: split, allowedMentions: { parse: [] } });
        }
    }
}
