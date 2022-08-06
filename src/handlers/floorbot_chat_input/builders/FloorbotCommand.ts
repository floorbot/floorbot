import { SlashCommandBuilder } from 'discord.js';

export class FloorbotCommand {

    public static slashCommand(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .setName('floorbot')
            .setDescription('floorbot ping, guild stats and bug reporting');
    }
}
