import { SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';

export enum DefineSlashCommandOption {
    Query = 'query'
}

export class DefineCommand {

    public static slashCommand(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .setName('define')
            .setDefaultMemberPermissions(0)
            .setDescription('Define a word yo!')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(DefineSlashCommandOption.Query)
                    .setDescription('What does this mean?')
                    .setAutocomplete(true)
                    .setRequired(false)
            ) as SlashCommandBuilder;
    }
}
