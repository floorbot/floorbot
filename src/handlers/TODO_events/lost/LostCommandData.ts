import { ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const LostCommandData: ChatInputApplicationCommandData = {
    name: 'lost',
    type: ApplicationCommandType.ChatInput,
    description: 'I lost'
};
