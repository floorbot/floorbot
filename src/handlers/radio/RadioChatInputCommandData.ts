import { ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const RadioChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'radio',
    dmPermission: false,
    type: ApplicationCommandType.ChatInput,
    description: 'Opens the radio controls'
};
