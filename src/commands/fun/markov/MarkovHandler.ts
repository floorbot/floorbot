import { CommandInteraction, Message, MessageActionRow, User, GuildChannel, TextChannel, InteractionReplyOptions, Util, MessageComponentInteraction, GuildMember, Permissions, Collection } from 'discord.js';
import { MarkovButton, MarkovButtonType } from './components/MarkovButton';
import { HandlerClient } from '../../../discord/HandlerClient';
import { MarkovCommandData } from './MarkovCommandData';
import { HandlerContext } from '../../../discord/Util';
import { MarkovEmbed } from './components/MarkovEmbed';
import { BaseHandler } from '../../BaseHandler';
import { MarkovDatabase } from './MarkovDatabase';
import Markov from 'markov-strings';
import * as owoify from 'owoify-js';

export class MarkovHandler extends BaseHandler {

    private static CORPUSES: Collection<string, Markov> = new Collection();

    constructor() {
        super({
            id: 'markov',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: MarkovCommandData
        })
    }

    public async execute(interaction: CommandInteraction): Promise<any> {
        const subCommand = interaction.options.getSubcommand();
        const channel = (interaction.options.getChannel('channel') || interaction.channel) as GuildChannel;
        if (await this.replyIfAdmin(interaction)) return;
        await interaction.deferReply();
        switch (subCommand) {
            case 'settings': {
                if (await this.replyIfAdmin(interaction)) return;
                const response = await this.fetchControlPanel(interaction, channel);
                let message = await interaction.followUp(response) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', async (component) => {
                    if (component.isButton()) {
                        if (await this.replyIfAdmin(component)) return;
                        await component.deferUpdate();
                        switch (component.customId as MarkovButtonType) {
                            case MarkovButtonType.POSTING_ENABLE:
                            case MarkovButtonType.POSTING_DISABLE: {
                                await MarkovDatabase.setChannel(channel, { posting: component.customId === MarkovButtonType.POSTING_ENABLE });
                                break;
                            }
                            case MarkovButtonType.TRACKING_ENABLE:
                            case MarkovButtonType.TRACKING_DISABLE: {
                                await MarkovDatabase.setChannel(channel, { tracking: component.customId === MarkovButtonType.TRACKING_ENABLE });
                                break;
                            }
                            case MarkovButtonType.LINKS_ENABLE:
                            case MarkovButtonType.LINKS_DISABLE: {
                                await MarkovDatabase.setChannel(channel, { links: component.customId === MarkovButtonType.LINKS_ENABLE });
                                break;
                            }
                            case MarkovButtonType.MENTIONS_ENABLE:
                            case MarkovButtonType.MENTIONS_DISABLE: {
                                await MarkovDatabase.setChannel(channel, { mentions: component.customId === MarkovButtonType.MENTIONS_ENABLE });
                                break;
                            }
                            case MarkovButtonType.OWOIFY_ENABLE:
                            case MarkovButtonType.OWOIFY_DISABLE: {
                                await MarkovDatabase.setChannel(channel, { owoify: component.customId === MarkovButtonType.OWOIFY_ENABLE });
                                break;
                            }
                            case MarkovButtonType.WIPE: {
                                Util.toggleMessageComponents(message, true);
                                await interaction.editReply({
                                    ...(message.content && { content: message.content }),
                                    embeds: [...message.embeds, MarkovEmbed.getWipeConfirmEmbed(interaction, channel)],
                                    components: [...message.components, new MessageActionRow().addComponents(
                                        MarkovButton.getMarkovButton(MarkovButtonType.BACKOUT),
                                        MarkovButton.getMarkovButton(MarkovButtonType.WIPE_CONFIRMED),
                                        MarkovButton.getMarkovButton(MarkovButtonType.PURGE_CONFIRMED)
                                    )],
                                });
                                return;
                            }
                            case MarkovButtonType.WIPE_CONFIRMED: {
                                await MarkovDatabase.deleteStrings(channel);
                                break;
                            }

                            case MarkovButtonType.PURGE_CONFIRMED: {
                                await MarkovDatabase.purge(interaction.guild!);
                                break;
                            }
                            case MarkovButtonType.BACKOUT: {
                                Util.toggleMessageComponents(message, false);
                                await message.edit({
                                    ...(message.content && { content: message.content }),
                                    embeds: message.embeds.slice(0, -1),
                                    components: message.components.slice(0, -1),
                                });
                                break;
                            }
                            default: { throw interaction }
                        }
                        const response = await this.fetchControlPanel(interaction, channel);
                        message = await interaction.editReply(response) as Message;


                    }
                });
                collector.on('end', this.createEnderFunction(message))
                return message;
            }
            case 'frequency': {
                const perMessages = interaction.options.getInteger('messages') || undefined;
                const perMinutes = interaction.options.getInteger('minutes') || undefined;
                const perMessagesMin = perMessages ? Math.max(perMessages, 5) : perMessages;
                await MarkovDatabase.setChannel(channel, { messages: perMessagesMin, minutes: perMinutes });
                const response = await this.fetchControlPanel(interaction, channel);
                return interaction.followUp(response);
            }
            case 'generate': {
                const user = interaction.options.getUser('user');
                const response = await this.fetchMarkovResponse(channel, user);
                return interaction.followUp(response ? response : MarkovEmbed.getFailedEmbed(interaction, channel, user).toReplyOptions());
            }
            default: throw interaction;
        }
    }

    private async replyIfAdmin(context: CommandInteraction | MessageComponentInteraction): Promise<Message | null> {
        if (!(context.member as GuildMember).permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const response = this.getEmbedTemplate(context).setDescription(`Sorry! Only admins can use the admin command`).toReplyOptions(true);
            return await context.reply({ ...response, fetchReply: true }) as Message;
        }
        return null;
    }

    private async fetchControlPanel(context: HandlerContext, channel: GuildChannel): Promise<InteractionReplyOptions> {
        const totals = await MarkovDatabase.fetchStringsTotals(channel);
        const channelData = await MarkovDatabase.fetchChannel(channel);
        const embed = MarkovEmbed.getControlPanel(context, channel, channelData, totals);
        const primaryRow = new MessageActionRow().addComponents([
            MarkovButton.getMarkovButton(channelData.posting ? MarkovButtonType.POSTING_DISABLE : MarkovButtonType.POSTING_ENABLE),
            MarkovButton.getMarkovButton(channelData.tracking ? MarkovButtonType.TRACKING_DISABLE : MarkovButtonType.TRACKING_ENABLE),
            MarkovButton.getMarkovButton(MarkovButtonType.WIPE)
        ]);
        const secondaryRow = new MessageActionRow().addComponents([
            MarkovButton.getMarkovButton(channelData.mentions ? MarkovButtonType.MENTIONS_DISABLE : MarkovButtonType.MENTIONS_ENABLE),
            MarkovButton.getMarkovButton(channelData.links ? MarkovButtonType.LINKS_DISABLE : MarkovButtonType.LINKS_ENABLE),
            MarkovButton.getMarkovButton(channelData.owoify ? MarkovButtonType.OWOIFY_DISABLE : MarkovButtonType.OWOIFY_ENABLE)
        ]);
        return { embeds: [embed], components: [primaryRow, secondaryRow] };
    }

    public async fetchMarkovResponse(channel: GuildChannel, user: User | null): Promise<InteractionReplyOptions | null> {
        const channelData = await MarkovDatabase.fetchChannel(channel);
        if (!MarkovHandler.CORPUSES.has(channel.id)) {
            const rows = await MarkovDatabase.fetchStrings(channel, user ? user : undefined);
            if (!rows.length) return null;
            const markov = new Markov({ stateSize: rows.length < 1000 ? 1 : 2 });
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
                    // !result.refs.some(ref => ref.string === res.string) && // No direct quoting
                    result.string.split(' ').length > minLength && // Word limits
                    (channelData.links || !/(https?:\/\/[a-zA-Z]+)/g.test(result.string)) // No links
                )
            });
            return resolve(res);
        }).then((res: any) => {
            const content = channelData.owoify ? owoify.default(res.string) : res.string;
            return { content: content, ...(!channelData.mentions && { allowedMentions: { parse: [] } }) };
        }).catch(() => {
            return null;
        });
    }

    public override async setup(client: HandlerClient): Promise<any> {
        await super.setup(client);
        await MarkovDatabase.setup(client).then(() => true);
        client.on('messageCreate', (message) => this.onMessageCreate(message));
        client.on('messageUpdate', (_oldMessage, newMessage) => this.onMessageCreate(<Message>newMessage));
        setInterval(() => {
            return client.guilds.cache.forEach(async guild => {
                const rows = await MarkovDatabase.fetchAllChannels(guild);
                return rows.filter(row => {
                    return row.posting;
                }).forEach(async data => {
                    const channel = <TextChannel>(await client.channels.fetch(<any>data.channel_id))!;
                    const random = Math.floor(Math.random() * data.minutes)
                    if (!random) {
                        const response = await this.fetchMarkovResponse(channel, null);
                        if (response) await channel.send(response);
                    }
                })
            })
        }, 1000 * 60) // Every minute
        return { message: 'Setup Database and created auto-post interval' }
    }

    private async onMessageCreate(message: Message) {
        const client = message.client as HandlerClient
        if (message.guild && await client.fetchGuildAppCommand(this, message.guild)) {
            const row = await MarkovDatabase.fetchChannel(<GuildChannel>message.channel);
            if (row.tracking) {
                await MarkovDatabase.setStrings(message);
                const markov = MarkovHandler.CORPUSES.get(message.channel.id);
                if (markov && message.content.length) markov.addData([message.content]);
            }
            if (row.posting && !message.editedTimestamp) {
                const random = Math.floor(Math.random() * row.messages)
                if (!random) {
                    const response = await this.fetchMarkovResponse(<GuildChannel>message.channel, null);
                    if (response) await message.channel.send(response);
                }
            }
        }
    }
}
