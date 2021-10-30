import * as FlipData from '../../../../res/flip_data.json';
import { CommandInteraction, Util } from 'discord.js';
import { FlipCommandData } from './FlipCommandData';
import { BaseHandler } from '../../BaseHandler';

export class FlipHandler extends BaseHandler {

    constructor() {
        super({
            id: 'flip',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: FlipCommandData
        })
    }

    public async execute(interaction: CommandInteraction): Promise<any> {
        await interaction.deferReply();

        const subCommand = interaction.options.getSubcommand();
        switch (subCommand) {
            case 'coin': {
                const count = interaction.options.getInteger('count') || 1;
                const heads = Math.round(this.random_bm() * count);
                const embed = this.getEmbedTemplate(interaction)
                    .setContextAuthor(interaction)
                    .setTitle(`You flipped ${Util.formatCommas(count)} coin${count > 1 ? 's' : ''}`)
                    .addField('Heads', Util.formatCommas(heads), true)
                    .addField('Tails', Util.formatCommas(count - heads), true);
                return interaction.followUp(embed.toReplyOptions());
            }
            case 'text': {
                const text = interaction.options.getString('text')!;
                const chars = text.split('').map(char => {
                    const reverse = Object.keys((<any>FlipData)).find(key => (<any>FlipData)[key] === char);
                    return reverse || ((<any>FlipData)[char] ? (<any>FlipData)[char] : char);
                }).reverse();
                return interaction.followUp({ content: chars.join(''), allowedMentions: { parse: [] } });
            }
            default: throw { interaction };
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
