import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandOptionTypes, ChannelTypes } = Constants

export const FloorbotCommandData: ChatInputApplicationCommandData = {
    name: 'floorbot',
    description: 'Base commands for floorbot',
    options: [{
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: 'commands',
        description: '[ADMIN] enable and disable commands for the guild'
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: 'about',
        description: 'See floorbot info (ping, invite, stats)'
    }, {
        name: 'screenshare',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: 'Create a link to screenshare in a voice channel',
        options: [{
            name: 'channel',
            type: ApplicationCommandOptionTypes.CHANNEL,
            description: 'The channel to get a screenshare link for',
            channelTypes: [ChannelTypes.GUILD_VOICE]
        }]
    }]
}
