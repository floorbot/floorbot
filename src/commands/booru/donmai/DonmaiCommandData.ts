import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes, ApplicationCommandOptionTypes } = Constants;

export const DonmaiCommandData = {
    create: (subDomain: string): ChatInputApplicationCommandData => {
        return {
            name: subDomain,
            type: ApplicationCommandTypes.CHAT_INPUT,
            description: `Search for random ${subDomain} images`,
            options: [{
                type: ApplicationCommandOptionTypes.STRING,
                description: 'The tags to search (multiple tags with +)',
                autocomplete: true,
                required: false,
                name: 'tags'
            }]
        }
    }
}
