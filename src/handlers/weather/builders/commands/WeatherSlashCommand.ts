import { WeatherSlashCommandSubcommand } from './WeatherSlashCommandSubcommand.js';
import { SlashCommandBuilder } from 'discord.js';

export class WeatherSlashCommand extends SlashCommandBuilder {

    public static global(): WeatherSlashCommand {
        const slashCommand = new WeatherSlashCommand()
            .setName('weather')
            .setDefaultMemberPermissions(0)
            .setDescription('Get weather, forecast or air pollution for places');
        slashCommand.addSubcommand(WeatherSlashCommandSubcommand.user());
        slashCommand.addSubcommand(WeatherSlashCommandSubcommand.location());
        slashCommand.addSubcommand(WeatherSlashCommandSubcommand.all());
        slashCommand.addSubcommand(WeatherSlashCommandSubcommand.link());
        slashCommand.addSubcommand(WeatherSlashCommandSubcommand.unlink());
        return slashCommand;
    }
}
