import { OwoifyCommandData } from './OwoifyCommandData';
import { CommandInteraction } from 'discord.js';
import { BaseHandler } from '../../BaseHandler';
import * as owoify from 'owoify-js';

export class OwoifyHandler extends BaseHandler {

    constructor() {
        super({
            id: 'owoify',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: OwoifyCommandData,
            description: `owo what's this?`
        })
    }

    public async execute(interaction: CommandInteraction): Promise<any> {
        const text = interaction.options.getString('text', true);
        await interaction.deferReply();
        const owo = owoify.default(text);
        return interaction.followUp({ content: owo, allowedMentions: { parse: [] } });
    }
}
