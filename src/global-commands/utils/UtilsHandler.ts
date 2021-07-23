import { CommandInteraction, Message, GuildMember, Guild, VoiceChannel, GuildChannel } from 'discord.js';
import { GlobalCommandHandler, UtilsCommandData, UtilsResponseFactory } from '../../..';

export class UtilsHandler extends GlobalCommandHandler {

    public readonly responseFactory: UtilsResponseFactory;

    constructor() {
        super({
            commandData: UtilsCommandData,
            nsfw: false,
            id: 'utils'
        });
        this.responseFactory = new UtilsResponseFactory(this);
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        const { guild, member } = <{ guild: Guild, member: GuildMember }>interaction;
        const subCommand = interaction.options.getSubCommand();

        switch (subCommand) {
            case 'ping': {
                await interaction.reply(this.responseFactory.getPingingResponse(interaction));
                const reply = await interaction.fetchReply() as Message;
                const response = this.responseFactory.getPingResponse(interaction, reply);
                return reply.edit(response);
            }
            case 'guild': {
                await interaction.defer();
                const response = await this.responseFactory.fetchGuildResponse(interaction, guild);
                return interaction.followUp(response);
            }
            case 'invite': {
                await interaction.defer();
                const response = this.responseFactory.getInviteResponse(interaction);
                return interaction.followUp(response);
            }
            case 'screenshare': {
                await interaction.defer();
                const channel = interaction.options.getChannel('channel') || member.voice.channel;
                if (!channel || !(channel instanceof GuildChannel)) return interaction.followUp(this.responseFactory.getNoVoiceChannelResponse(interaction));
                if (!(channel instanceof VoiceChannel)) return interaction.followUp(this.responseFactory.getInvalidChannelResponse(interaction, channel));
                return interaction.followUp(this.responseFactory.getScreenShareResponse(interaction, channel));
            }
            default: throw interaction;
        }
    }
}
