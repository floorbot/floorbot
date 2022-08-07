import { SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';

export enum DefineChatInputOption {
    Query = 'query'
}

export class DefineCommand {

    public static slashCommand(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .setName('define')
            .setDescription('Define a word yo!')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(DefineChatInputOption.Query)
                    .setDescription('What does this mean?')
                    .setAutocomplete(true)
                    .setRequired(false)
            ) as SlashCommandBuilder;
    }
}
