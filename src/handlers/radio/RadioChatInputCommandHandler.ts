import { joinVoiceChannel } from '@discordjs/voice';
import { ChatInputCommandInteraction } from 'discord.js';
import { ChatInputCommandHandler, HandlerClient } from 'discord.js-handlers';
import { RadioChatInputCommandData } from './RadioChatInputCommandData.js';

import 'libsodium-wrappers';
import { ListenMoeJPop } from './stations/ListenMoeJPop.js';
import { ListenMoeKPop } from './stations/ListenMoeKPop.js';

export class RadioChatInputCommandHandler extends ChatInputCommandHandler {

    private readonly jPop = new ListenMoeJPop();
    private readonly kPop = new ListenMoeKPop();

    constructor() {
        super(RadioChatInputCommandData);
    }

    public async run(chatInput: ChatInputCommandInteraction): Promise<any> {
        if (!chatInput.inCachedGuild()) return;
        await chatInput.deferReply();
        if (chatInput.member.voice.channel) {
            const channel = chatInput.member.voice.channel;
            if (channel.joinable) {
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });
                connection.subscribe(this.jPop);
            }
        }
    }

    public override async setup({ client }: { client: HandlerClient; }): Promise<any> {
        const setup = await super.setup({ client });
        this.jPop.startRadio();
        this.kPop.startRadio();
        return setup;
    }
}
