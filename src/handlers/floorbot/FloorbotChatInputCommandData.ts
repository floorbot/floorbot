import { ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const FloorbotChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'floorbot',
    type: ApplicationCommandType.ChatInput,
    description: 'floorbot ping, guild stats and feedback'
};
