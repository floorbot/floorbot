import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandOptionTypes, ChannelTypes } = Constants;

export const UtilsCommandData: ChatInputApplicationCommandData = {
    name: 'utils',
    description: 'Various tools and info for the bot or current guild',
    options: [{
        name: 'ping',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: 'Get the bots ping and heartbeat'
    }, {
        name: 'guild',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: 'Show stats for the current server'
    }, {
        name: 'invite',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: 'Get the invite link for the bot'
    }, {
        name: 'screenshare',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: 'Get the bots ping and heartbeat',
        options: [{
            name: 'channel',
            type: ApplicationCommandOptionTypes.CHANNEL,
            description: 'The channel to get a screenshare link for',
            channelTypes: [ChannelTypes.GUILD_VOICE]
        }]
    }]
}
