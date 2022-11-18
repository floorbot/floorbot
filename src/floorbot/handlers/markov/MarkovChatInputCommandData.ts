import { ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const MarkovChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'markov',
    dmPermission: false,
    type: ApplicationCommandType.ChatInput,
    description: '[ADMIN] Opens a control panel for markov'
};
