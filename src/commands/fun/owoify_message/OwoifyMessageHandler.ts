import { OwoifyMessageCommandData } from './OwoifyMessageCommandData';
import { ContextMenuInteraction } from 'discord.js';
import { BaseHandler } from '../../BaseHandler';
import * as owoify from 'owoify-js';

export class OwoifyMessageHandler extends BaseHandler {

    constructor() {
        super({
            id: 'owoify_message',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: OwoifyMessageCommandData,
            description: `owo what's this?`
        })
    }

    public async execute(interaction: ContextMenuInteraction): Promise<any> {
        const text = interaction.options.getMessage('message', true).content;
        if (!text.length) return interaction.reply({ content: 'Sorry! That message does not have any content to owoify...', ephemeral: true });
        await interaction.deferReply();
        const owo = owoify.default(text);
        return interaction.followUp({ content: owo, allowedMentions: { parse: [] } });
    }
}
