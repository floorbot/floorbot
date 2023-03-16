import { getVoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import { ChatInputCommandInteraction, Collection, MessageComponentInteraction } from 'discord.js';
import { ChatInputCommandHandler, HandlerClient } from 'discord.js-handlers';
import { ReplyBuilder } from '../../core/builders/ReplyBuilder.js';
import { Util } from '../../core/Util.js';
import { RadioButtonId, RadioSelectMenuId } from './builders/RadioMessageActionRowBuilder.js';
import { RadioReplyBuilder } from './builders/RadioReplyBuilder.js';
import { RadioChatInputCommandData } from './RadioChatInputCommandData.js';
import { RadioStationAudioPlayer } from './RadioStationAudioPlayer.js';
import { ListenMoeGenre, ListenMoeStation } from './stations/ListenMoeStation.js';

//http://fmstream.org/index.php?s=nightcore
//http://gamestream.rainwave.cc:8000/game.mp3

export class RadioChatInputCommandHandler extends ChatInputCommandHandler {

    private readonly stations: Collection<string, RadioStationAudioPlayer>;

    constructor() {
        super(RadioChatInputCommandData);
        const jpop = new ListenMoeStation({ genre: ListenMoeGenre.JPop });
        const kpop = new ListenMoeStation({ genre: ListenMoeGenre.KPop });
        this.stations = new Collection();
        this.stations.set(jpop.id, jpop);
        this.stations.set(kpop.id, kpop);
    }

    public async run(chatInput: ChatInputCommandInteraction): Promise<any> {
        if (!chatInput.inCachedGuild()) return await chatInput.reply(new ReplyBuilder(chatInput).addEmbedMessage({ content: 'Sorry, I am unable to support radio for this guild or channel' }));
        await chatInput.deferReply();
        const replyOptions = new RadioReplyBuilder()
            .addRadioEmbed()
            .addRadioButtonsActionRow()
            .addRadioStationsActionRow({ stations: this.stations });
        const message = await chatInput.followUp(replyOptions);
        const collector = Util.createComponentCollector(chatInput.client, message);
        collector.on('collect', async (component: MessageComponentInteraction): Promise<any> => {
            if (!component.inCachedGuild()) return await component.reply(new ReplyBuilder(component).addEmbedMessage({ content: 'Sorry, I am unable to support radio for this guild or channel' }));

            // Joining voice channels
            if (component.isButton() && component.customId === RadioButtonId.JoinChannel) {
                const channel = component.member.voice.channel;
                if (!channel) return await component.reply(new ReplyBuilder(component).addEmbedMessage({ content: 'Please join a voice channel to use the radio command' }));
                if (!channel.joinable) return await component.reply(new ReplyBuilder(component).addEmbedMessage({ content: 'Sorry, I am unable to join that voice channel' }));
                const connection = joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, });
                return connection.subscribe(this.stations.random()!);
            }

            // Changing the radio station for guild
            if (component.isStringSelectMenu() && component.customId === RadioSelectMenuId.Station) {
                const station = this.stations.get(component.values[0] ?? '');
                const connection = getVoiceConnection(component.guildId);
                // This is bad, the connection should be stored in db for when bot does connect...
                if (!station || !connection) return await component.reply(new ReplyBuilder(component).addUnexpectedErrorEmbed());
                return connection.subscribe(station);
            }
        });
    }

    public override async setup({ client }: { client: HandlerClient; }): Promise<any> {
        const setup = await super.setup({ client });
        for (const [_id, station] of this.stations) {
            console.log(`[radio] Started ${station.name}`);
            station.start();
        }
        return setup;
    }
}
