import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandOptionTypes } = Constants

export const AdminCommandData: ChatInputApplicationCommandData = {
    name: 'admin',
    description: '[ADMIN] Admin related commands for this bot',
    options: [{
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: 'commands',
        description: '[ADMIN] enable and disable commands for the guild'
    }]
}
