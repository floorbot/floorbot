import { FlipMessageCommandData } from './FlipMessageCommandData';
import * as FlipData from '../../../../res/flip_data.json';
import { ContextMenuInteraction } from 'discord.js';
import { BaseHandler } from '../../BaseHandler';

export class FlipMessageHandler extends BaseHandler {

    constructor() {
        super({
            id: 'flip_message',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: FlipMessageCommandData,
            description: 'Flip the target message text'
        })
    }

    public async execute(interaction: ContextMenuInteraction): Promise<any> {
        const text = interaction.options.getMessage('message', true).content;
        if (!text.length) return interaction.reply({ content: 'Sorry! That message does not have any content to flip...', ephemeral: true });
        await interaction.deferReply();
        const chars = text.split('').map(char => {
            const reverse = Object.keys((<any>FlipData)).find(key => (<any>FlipData)[key] === char);
            return reverse || ((<any>FlipData)[char] ? (<any>FlipData)[char] : char);
        }).reverse();
        return interaction.followUp({ content: chars.join(''), allowedMentions: { parse: [] } });
    }
}
