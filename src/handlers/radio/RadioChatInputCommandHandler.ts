import { joinVoiceChannel } from '@discordjs/voice';
import { ChatInputCommandInteraction } from 'discord.js';
import { ChatInputCommandHandler, HandlerClient } from 'discord.js-handlers';
import { RadioChatInputCommandData } from './RadioChatInputCommandData.js';

import 'libsodium-wrappers';
import { ReplyBuilder } from '../../core/builders/ReplyBuilder.js';
import { ListenMoeJPop } from './stations/ListenMoeJPop.js';
import { ListenMoeKPop } from './stations/ListenMoeKPop.js';

export class RadioChatInputCommandHandler extends ChatInputCommandHandler {

    private readonly jPop = new ListenMoeJPop();
    private readonly kPop = new ListenMoeKPop();

    constructor() {
        super(RadioChatInputCommandData);
    }

    public async run(chatInput: ChatInputCommandInteraction): Promise<any> {
        if (!chatInput.inCachedGuild()) { return await chatInput.reply(new ReplyBuilder(chatInput).addEmbedMessage({ content: 'Sorry, I am unable to support radio from this guild/channel' })); }
        if (!chatInput.member.voice.channel) { return await chatInput.reply(new ReplyBuilder(chatInput).addEmbedMessage({ content: 'Please join a voice channel to use the radio command' })); }
        if (!chatInput.member.voice.channel.joinable) { return await chatInput.reply(new ReplyBuilder(chatInput).addEmbedMessage({ content: 'Sorry, I am unable to join that voice channel' })); }
        await chatInput.deferReply();
        //http://fmstream.org/index.php?s=nightcore
        const channel = chatInput.member.voice.channel;
        if (channel.joinable) {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            connection.subscribe(this.jPop);
            connection.on('stateChange', (oldState, newState) => {
                console.log(`[Connection ${connection.joinConfig.channelId}] ${oldState.status} -> ${newState.status}`);
            });
            connection.on('error', error => {
                console.error(`[Connection ${connection.joinConfig.channelId}] Error: ${error.message} with resource `);
            });
        }
    }

    public override async setup({ client }: { client: HandlerClient; }): Promise<any> {
        const setup = await super.setup({ client });
        this.kPop.startRadio();
        return setup;
    }
}
