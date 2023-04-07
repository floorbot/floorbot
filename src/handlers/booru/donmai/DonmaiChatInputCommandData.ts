import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';
import { DonmaiAPISubDomain } from '../../../api/apis/donmai/DonmaiAPI.js';

export enum DonmaiSlashCommandStringOptionName {
    Tags = 'tags'
}

export const DonmaiChatInputCommandData = {
    create: (subDomain: DonmaiAPISubDomain): ChatInputApplicationCommandData => {
        return {
            name: subDomain,
            type: ApplicationCommandType.ChatInput,
            description: `Search for random ${subDomain} images`,
            options: [{
                type: ApplicationCommandOptionType.String,
                description: 'The tags to search (multiple tags with +)',
                autocomplete: true,
                required: false,
                name: DonmaiSlashCommandStringOptionName.Tags
            }]
        };
    }
};
