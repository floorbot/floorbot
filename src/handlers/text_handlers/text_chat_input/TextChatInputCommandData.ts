import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export enum TextChatInputSubcommand {
    Owoify = 'owoify',
    Flip = 'flip',
    Leet = '1337',
    Tiny = 'tiny'
}

export const TextChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'text',
    type: ApplicationCommandType.ChatInput,
    description: 'Do stuff with text',
    options: [{
        type: ApplicationCommandOptionType.Subcommand,
        description: 'owo what\'s this?',
        name: TextChatInputSubcommand.Owoify,
        options: [{
            type: ApplicationCommandOptionType.String,
            description: 'owo this',
            required: true,
            name: 'text'
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        description: 'flip turned upside down',
        name: TextChatInputSubcommand.Flip,
        options: [{
            type: ApplicationCommandOptionType.String,
            description: 'flip this',
            required: true,
            name: 'text'
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        description: '1337 speak',
        name: TextChatInputSubcommand.Leet,
        options: [{
            type: ApplicationCommandOptionType.String,
            description: '1337 this',
            required: true,
            name: 'text'
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        description: 'ₜᵢₙᵧ ₜₑₓₜ',
        name: TextChatInputSubcommand.Tiny,
        options: [{
            type: ApplicationCommandOptionType.String,
            description: 'tiny this',
            required: true,
            name: 'text'
        }]
    }]
};
