import { ChatInputHandler } from '../../../../lib/discord/handlers/abstracts/ChatInputHandler.js';
import { OwoifyChatInputCommandData } from './OwoifyChatInputCommandData.js';
import { CommandInteraction, Util } from 'discord.js';
import owoify from 'owoify-js';

export class OwoifyChatInputHandler extends ChatInputHandler {

    constructor() {
        super({ group: 'Fun', global: false, nsfw: false, data: OwoifyChatInputCommandData });
    }

    public async execute(command: CommandInteraction): Promise<any> {
        const text = command.options.getString('text', true);
        await command.deferReply();
        const owo = (<any>owoify).default(text);
        const split = Util.splitMessage(owo, { maxLength: 2000 })[0]!;
        return command.followUp({ content: split, allowedMentions: { parse: [] } });
    }
}
