import { FlipChatInputCommandData } from './FlipChatInputCommandData';
import { HandlerReply } from '../../../../components/HandlerReply';
import { CommandInteraction, Util } from 'discord.js';
import { BaseHandler } from '../../../BaseHandler';
import { Flipper } from '../Flipper';

export class FlipChatInputHandler extends BaseHandler {

    constructor() {
        super({
            id: 'flip_chat_input',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: FlipChatInputCommandData
        })
    }

    public async execute(command: CommandInteraction): Promise<any> {
        await command.deferReply();
        const subCommand = command.options.getSubcommand();
        switch (subCommand) {
            case 'coin': {
                const count = command.options.getInteger('count') || 1;
                const heads = Math.round(this.random_bm() * count);
                const embed = this.getEmbedTemplate(command)
                    .setContextAuthor(command)
                    .setTitle(`You flipped ${Util.formatCommas(count)} coin${count > 1 ? 's' : ''}`)
                    .addField('Heads', Util.formatCommas(heads), true)
                    .addField('Tails', Util.formatCommas(count - heads), true);
                return command.followUp(embed.toReplyOptions());
            }
            case 'text': {
                const text = command.options.getString('text', true);
                const flipped = Flipper.flipText(text);
                const split = Util.splitMessage(flipped, { maxLength: 2000 })[0]!
                return command.followUp({ content: split, allowedMentions: { parse: [] } });
            }
            default: {
                return command.followUp(HandlerReply.createUnexpectedErrorReply(command, this));
            }
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
