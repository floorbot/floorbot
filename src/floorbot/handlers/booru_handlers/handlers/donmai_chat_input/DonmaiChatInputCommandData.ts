import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const DonmaiChatInputCommandData = {
    create: (subDomain: string): ChatInputApplicationCommandData => {
        return {
            name: subDomain,
            type: ApplicationCommandType.ChatInput,
            description: `Search for random ${subDomain} images`,
            options: [{
                type: ApplicationCommandOptionType.String,
                description: 'The tags to search (multiple tags with +)',
                autocomplete: true,
                required: false,
                name: 'tags'
            }]
        };
    }
};
