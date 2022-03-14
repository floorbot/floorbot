import { ApplicationCommandOptionType, ChannelType, ChatInputApplicationCommandData } from 'discord.js';

export const FloorbotCommandData: ChatInputApplicationCommandData = {
    name: 'floorbot',
    description: 'Base commands for floorbot',
    options: [{
        type: ApplicationCommandOptionType.Subcommand,
        name: 'commands',
        description: '[ADMIN] enable and disable commands for the guild'
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'about',
        description: 'See floorbot info (ping, invite, stats)'
    }, {
        name: 'screenshare',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Create a link to screenshare in a voice channel',
        options: [{
            name: 'channel',
            type: ApplicationCommandOptionType.Channel,
            description: 'The channel to get a screenshare link for',
            channelTypes: [ChannelType.GuildVoice]
        }]
    }]
};
