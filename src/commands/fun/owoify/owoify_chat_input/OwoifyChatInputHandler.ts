import { OwoifyChatInputCommandData } from './OwoifyChatInputCommandData';
import { CommandInteraction, Util } from 'discord.js';
import { BaseHandler } from '../../../BaseHandler';
import * as owoify from 'owoify-js';

export class OwoifyChatInputHandler extends BaseHandler {

    constructor() {
        super({
            id: 'owoify_chat_input',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: OwoifyChatInputCommandData,
            description: `owo what's this?`
        })
    }

    public async execute(command: CommandInteraction): Promise<any> {
        const text = command.options.getString('text', true);
        await command.deferReply();
        const owo = owoify.default(text);
        const split = Util.splitMessage(owo, { maxLength: 2000 })[0]!
        return command.followUp({ content: split, allowedMentions: { parse: [] } });
    }
}
