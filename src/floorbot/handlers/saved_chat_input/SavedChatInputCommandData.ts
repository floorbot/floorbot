import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export enum SavedChatInputSubcommand {
    Boorus = 'boorus'
}

export const SavedChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'saved',
    type: ApplicationCommandType.ChatInput,
    description: 'See the things a user has saved!',
    options: [{
        type: ApplicationCommandOptionType.Subcommand,
        description: 'See the boorus a user has saved!',
        name: SavedChatInputSubcommand.Boorus,
        options: [{
            type: ApplicationCommandOptionType.User,
            description: 'The user to see saved boorus for',
            required: false,
            name: 'user',
        }]
    }]
};
