import { TextChatInputCommandData, TextChatInputSubcommand } from './TextChatInputCommandData.js';
import { ChatInputApplicationCommandData, ChatInputCommandInteraction } from 'discord.js';
import { ApplicationCommandHandler } from 'discord.js-handlers';
import { TextReplyBuilder } from './TextReplyBuilder.js';

export class TextChatInputHandler extends ApplicationCommandHandler<ChatInputApplicationCommandData> {

    constructor() {
        super(TextChatInputCommandData);
    }

    public async run(command: ChatInputCommandInteraction): Promise<void> {
        const subcommand = command.options.getSubcommand(true);
        switch (subcommand) {
            case TextChatInputSubcommand.Owoify: {
                const text = command.options.getString('text', true);
                const replyOptions = new TextReplyBuilder(command).setOwoifiedContent(text);
                return command.reply(replyOptions);
            }
            case TextChatInputSubcommand.Flip: {
                const text = command.options.getString('text', true);
                const replyOptions = new TextReplyBuilder(command).setFlippedContent(text);
                return command.reply(replyOptions);
            }
            case TextChatInputSubcommand.Leet: {
                const text = command.options.getString('text', true);
                const replyOptions = new TextReplyBuilder(command).set1337Content(text);
                return command.reply(replyOptions);
            }
            case TextChatInputSubcommand.Tiny: {
                const text = command.options.getString('text', true);
                const replyOptions = new TextReplyBuilder(command).setTinyTextContent(text);
                return command.reply(replyOptions);
            }
        }
    }
}
