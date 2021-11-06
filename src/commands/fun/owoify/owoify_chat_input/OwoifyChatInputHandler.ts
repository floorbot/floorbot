import { ChatInputHandler } from '../../../../discord/handler/abstracts/ChatInputHandler';
import { OwoifyChatInputCommandData } from './OwoifyChatInputCommandData';
import { CommandInteraction, Util } from 'discord.js';
import * as owoify from 'owoify-js';

export class OwoifyChatInputHandler extends ChatInputHandler {

    constructor() {
        super({ group: 'Fun', global: false, nsfw: false, data: OwoifyChatInputCommandData });
    }

    public async execute(command: CommandInteraction): Promise<any> {
        const text = command.options.getString('text', true);
        await command.deferReply();
        const owo = owoify.default(text);
        const split = Util.splitMessage(owo, { maxLength: 2000 })[0]!
        return command.followUp({ content: split, allowedMentions: { parse: [] } });
    }
}
