import { CommandInteraction, Message, User, GuildChannel, TextChannel, InteractionReplyOptions, MessageComponentInteraction, Collection, Interaction } from 'discord.js';
import { ChatInputHandler } from '../../../lib/discord/handlers/abstracts/ChatInputHandler.js';
import { HandlerDB } from '../../../lib/discord/helpers/HandlerDatabase.js';
import { HandlerClient } from '../../../lib/discord/HandlerClient.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import { MarkovButtonType, MarkovReplyBuilder } from './MarkovReplyBuilder.js';
import { MarkovCommandData } from './MarkovCommandData.js';
import { MarkovDatabase } from './MarkovDatabase.js';
import Markov from 'markov-strings';
import { owoify } from 'owoifyx';

export class MarkovHandler extends ChatInputHandler {

    private static CORPUSES: Collection<string, Markov> = new Collection();
    private readonly database: MarkovDatabase;

    constructor(db: HandlerDB) {
        super({ group: 'Fun', global: false, nsfw: false, data: MarkovCommandData });
        this.database = new MarkovDatabase(db);
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {
        const subCommand = command.options.getSubcommand();
        const channel = (command.options.getChannel('channel') || command.channel) as GuildChannel;

        switch (subCommand) {
            case 'settings': {
                if (!HandlerUtil.isAdminOrOwner(command.member)) return command.reply(new MarkovReplyBuilder(command).addAdminOrOwnerEmbed());
                await command.deferReply();
                const response = await this.fetchControlPanel(command, channel);
                const message = await command.followUp(response) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectHandler(command, message, channel));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                return message;
            }
            case 'frequency': {
                if (!HandlerUtil.isAdminOrOwner(command.member)) return command.reply(new MarkovReplyBuilder(command).addAdminOrOwnerEmbed());
                await command.deferReply();
                const perMessages = command.options.getInteger('messages') || undefined;
                const perMinutes = command.options.getInteger('minutes') || undefined;
                const perMessagesMin = perMessages ? Math.max(perMessages, 5) : perMessages;
                await this.database.setChannel(channel, { messages: perMessagesMin, minutes: perMinutes });
                const response = await this.fetchControlPanel(command, channel);
                const message = await command.followUp(response);
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectHandler(command, message, channel));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                return message;
            }
            case 'generate': {
                await command.deferReply();
                const user = command.options.getUser('user');
                const response = await this.fetchMarkovResponse(channel, user);
                return command.followUp(response ? response : new MarkovReplyBuilder(command).addMarkovFailedEmbed(channel, user));
            }
            default: throw command;
        }
    }

    private async fetchControlPanel(interaction: Interaction, channel: GuildChannel): Promise<MarkovReplyBuilder> {
        const totals = await this.database.fetchStringsTotals(channel);
        const channelData = await this.database.fetchChannel(channel);
        const embed = new MarkovReplyBuilder(interaction).addMarkovControlPanel(channel, channelData, totals)
            .addMarkovActionRow(channelData);
        return embed;
    }

    public async fetchMarkovResponse(channel: GuildChannel, user: User | null): Promise<InteractionReplyOptions | null> {
        const channelData = await this.database.fetchChannel(channel);
        if (!MarkovHandler.CORPUSES.has(channel.id)) {
            const rows = await this.database.fetchStrings(channel, user ? user : undefined);
            if (!rows.length) return null;
            const markov = new (<any>Markov).default({ stateSize: rows.length < 1000 ? 1 : 2 }) as Markov;
            markov.addData(rows.map(row => row.content));
            MarkovHandler.CORPUSES.set(channel.id, markov);
        }
        const markov = MarkovHandler.CORPUSES.get(channel.id)!;
        return new Promise((resolve, _reject) => {
            const minLength = Math.floor(Math.random() * 10);
            const res = markov.generate({
                maxTries: 100,
                prng: Math.random,
                filter: (result) => (
                    result.refs.length > 1 && // Multiple refs please
                    result.string.split(' ').length > minLength && // Word limits
                    (channelData.links || !/(https?:\/\/[a-zA-Z]+)/g.test(result.string)) && // No links
                    (channelData.quoting || !result.refs.some(ref => ref.string === result.string)) // No exact quoting
                )
            });
            return resolve(res);
        }).then((res: any) => {
            const content = channelData.owoify ? owoify(res.string) : res.string;
            return { content: content, ...(!channelData.mentions && { allowedMentions: { parse: [] } }) };
        }).catch(() => {
            return null;
        });
    }

    private createCollectHandler(command: CommandInteraction, message: Message, channel: GuildChannel) {
        return async (component: MessageComponentInteraction<'cached'>) => {
            try {
                if (component.isButton()) {
                    if (!HandlerUtil.isAdminOrOwner(component.member, command)) return command.reply(new MarkovReplyBuilder(command).addAdminOrOwnerEmbed());
                    await component.deferUpdate();
                    switch (component.customId as MarkovButtonType) {
                        case MarkovButtonType.POSTING_ENABLE:
                        case MarkovButtonType.POSTING_DISABLE: {
                            await this.database.setChannel(channel, { posting: component.customId === MarkovButtonType.POSTING_ENABLE });
                            break;
                        }
                        case MarkovButtonType.TRACKING_ENABLE:
                        case MarkovButtonType.TRACKING_DISABLE: {
                            await this.database.setChannel(channel, { tracking: component.customId === MarkovButtonType.TRACKING_ENABLE });
                            break;
                        }
                        case MarkovButtonType.LINKS_ENABLE:
                        case MarkovButtonType.LINKS_DISABLE: {
                            await this.database.setChannel(channel, { links: component.customId === MarkovButtonType.LINKS_ENABLE });
                            break;
                        }
                        case MarkovButtonType.MENTIONS_ENABLE:
                        case MarkovButtonType.MENTIONS_DISABLE: {
                            await this.database.setChannel(channel, { mentions: component.customId === MarkovButtonType.MENTIONS_ENABLE });
                            break;
                        }
                        case MarkovButtonType.OWOIFY_ENABLE:
                        case MarkovButtonType.OWOIFY_DISABLE: {
                            await this.database.setChannel(channel, { owoify: component.customId === MarkovButtonType.OWOIFY_ENABLE });
                            break;
                        }
                        case MarkovButtonType.QUOTING_ENABLE:
                        case MarkovButtonType.QUOTING_DISABLE: {
                            await this.database.setChannel(channel, { quoting: component.customId === MarkovButtonType.QUOTING_ENABLE });
                            break;
                        }
                        case MarkovButtonType.WIPE: {
                            HandlerUtil.toggleMessageComponents(message, true);
                            const embed = new MarkovReplyBuilder(command).addMarkovWipeConfirmEmbed(channel)
                                .addMarkovWipeActionRow();
                            await component.editReply({
                                ...(message.content && { content: message.content }),
                                embeds: [...message.embeds, ...embed.embeds ?? []],
                                components: [...message.components, ...embed.components ?? []]
                            });
                            return;
                        }
                        case MarkovButtonType.WIPE_CONFIRMED: {
                            await this.database.deleteStrings(channel);
                            break;
                        }

                        case MarkovButtonType.PURGE_CONFIRMED: {
                            await this.database.purge(component.guild);
                            break;
                        }
                        case MarkovButtonType.BACKOUT: {
                            const updatedMessage = await message.fetch();
                            HandlerUtil.toggleMessageComponents(updatedMessage, false);
                            await updatedMessage.edit({
                                ...(updatedMessage.content && { content: updatedMessage.content }),
                                embeds: updatedMessage.embeds.slice(0, -1),
                                components: updatedMessage.components.slice(0, -1),
                            });
                            break;
                        }
                        default: { throw component; }
                    }
                    const response = await this.fetchControlPanel(command, channel);
                    message = await component.editReply(response) as Message;
                }
            } catch { }
        };
    }

    public override async setup(client: HandlerClient): Promise<any> {
        await super.setup(client).then(() => this.database.createTables()).then(() => true);
        client.on('messageCreate', (message) => this.onMessageCreate(message));
        client.on('messageUpdate', (_oldMessage, newMessage) => this.onMessageCreate(<Message>newMessage));
        setInterval(() => {
            return client.guilds.cache.forEach(async guild => {
                const rows = await this.database.fetchAllChannels(guild);
                return rows.filter(row => row.posting).forEach(async data => {
                    const channel = await client.channels.fetch(data.channel_id) as TextChannel | null;
                    const random = Math.floor(Math.random() * data.minutes);
                    if (channel && !random) {
                        const response = await this.fetchMarkovResponse(channel, null);
                        if (response) await channel.send(response);
                    }
                });
            });
        }, 1000 * 60); // Every minute
        return { message: 'Setup Database and created auto-post interval' };
    }

    private async onMessageCreate(message: Message) {
        if (message.guild && message.channel instanceof TextChannel) {
            const commands = await message.guild.commands.fetch();
            const enabled = commands.some(command => command.name === this.data.name && command.type === 'CHAT_INPUT');
            if (enabled) {
                const row = await this.database.fetchChannel(message.channel);
                if (row.tracking) {
                    await this.database.setStrings(message);
                    const markov = MarkovHandler.CORPUSES.get(message.channel.id);
                    if (markov && message.content.length) markov.addData([message.content]);
                }
                if (row.posting && !message.editedTimestamp) {
                    const random = Math.floor(Math.random() * row.messages);
                    if (!random) {
                        const response = await this.fetchMarkovResponse(message.channel, null);
                        if (response) await message.channel.send(response);
                    }
                }
            }
        }
    }
}
