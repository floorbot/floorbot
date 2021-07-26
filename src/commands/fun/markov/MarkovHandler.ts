import { CommandInteraction, ApplicationCommand, Message, ButtonInteraction, MessageActionRow, User, GuildChannel, TextChannel, InteractionReplyOptions, Permissions } from 'discord.js';
import { MarkovCommandData, MarkovDatabase, GuildHandler, MarkovButtonFactory, MarkovEmbedFactory, GuildHandlerGroup } from '../../..';
import { CommandClient, HandlerContext, HandlerCustomData, HandlerResult } from 'discord.js-commands';
import { PoolConfig } from 'mariadb';
import Markov from 'markov-strings';
import * as owoify from 'owoify-js';

export enum MarkovButtonType {
    POSTING_ENABLE = 'Enable Posting',
    POSTING_DISABLE = 'Disable Posting',
    TRACKING_ENABLE = 'Enable Tracking',
    TRACKING_DISABLE = 'Disable Tracking',
    LINKS_ENABLE = 'Enable Links',
    LINKS_DISABLE = 'Disable Links',
    MENTIONS_ENABLE = 'Enable Mentions',
    MENTIONS_DISABLE = 'Disable Mentions',
    OWOIFY_ENABLE = 'Enable OwO',
    OWOIFY_DISABLE = 'Disable OwO',
    WIPE = 'Wipe Data',
    WIPE_CONFIRMED = 'Confirm Wipe Data',
    PURGE_CONFIRMED = 'Purge All Data',
    BACKOUT = 'Backout'
}

export interface MarkovCustomData extends HandlerCustomData {
    readonly type: MarkovButtonType,
    readonly channel: string
}

export class MarkovHandler extends GuildHandler<MarkovCustomData> {

    public readonly database: MarkovDatabase;

    constructor(poolConfig: PoolConfig) {
        super({
            id: 'markov',
            group: GuildHandlerGroup.FUN,
            commandData: MarkovCommandData,
            permissions: [Permissions.FLAGS.ADMINISTRATOR]
        });
        this.database = new MarkovDatabase(poolConfig, 20, 1);
    }

    public override async isAuthorised(context: HandlerContext, customData?: MarkovCustomData): Promise<string[]> {
        if (context instanceof CommandInteraction && ['generate'].includes(context.options.getSubCommand())) { return []; }
        return super.isAuthorised(context, customData);
    }

    public override async onCommand(interaction: CommandInteraction): Promise<any> {
        const subCommand = interaction.options.getSubCommand();
        const channel = (interaction.options.getChannel('channel') || interaction.channel) as GuildChannel;
        await interaction.defer();
        switch (subCommand) {
            case 'settings': {
                const response = await this.fetchControlPanel(interaction, channel);
                return interaction.followUp(response);
            }
            case 'frequency': {
                const perMessages = interaction.options.getInteger('messages') || undefined;
                const perMinutes = interaction.options.getInteger('minutes') || undefined;
                const perMessagesMin = perMessages ? Math.max(perMessages, 5) : perMessages;
                await this.database.setChannel(channel, { messages: perMessagesMin, minutes: perMinutes });
                const response = await this.fetchControlPanel(interaction, channel);
                return interaction.followUp(response);
            }
            case 'generate': {
                const user = interaction.options.getUser('user');
                const response = await this.fetchMarkovResponse(channel, user);
                return interaction.followUp(response ? response : MarkovEmbedFactory.getFailedEmbed(this, interaction, channel, user).toReplyOptions());
            }
            default: throw interaction;
        }
    }

    public override async onButton(interaction: ButtonInteraction, customData: MarkovCustomData): Promise<any> {
        await interaction.deferUpdate();
        const channel = <GuildChannel>(await interaction.client.channels.fetch(<any>customData.channel));

        switch (customData.type) {
            case MarkovButtonType.POSTING_ENABLE:
            case MarkovButtonType.POSTING_DISABLE: {
                await this.database.setChannel(channel, { posting: customData.type === MarkovButtonType.POSTING_ENABLE });
                const response = await this.fetchControlPanel(interaction, channel);
                return (<Message>interaction.message).edit(response);
            }
            case MarkovButtonType.TRACKING_ENABLE:
            case MarkovButtonType.TRACKING_DISABLE: {
                await this.database.setChannel(channel, { tracking: customData.type === MarkovButtonType.TRACKING_ENABLE });
                const response = await this.fetchControlPanel(interaction, channel);
                return (<Message>interaction.message).edit(response);
            }
            case MarkovButtonType.LINKS_ENABLE:
            case MarkovButtonType.LINKS_DISABLE: {
                await this.database.setChannel(channel, { links: customData.type === MarkovButtonType.LINKS_ENABLE });
                const response = await this.fetchControlPanel(interaction, channel);
                return (<Message>interaction.message).edit(response);
            }
            case MarkovButtonType.MENTIONS_ENABLE:
            case MarkovButtonType.MENTIONS_DISABLE: {
                await this.database.setChannel(channel, { mentions: customData.type === MarkovButtonType.MENTIONS_ENABLE });
                const response = await this.fetchControlPanel(interaction, channel);
                return (<Message>interaction.message).edit(response);
            }
            case MarkovButtonType.OWOIFY_ENABLE:
            case MarkovButtonType.OWOIFY_DISABLE: {
                await this.database.setChannel(channel, { owoify: customData.type === MarkovButtonType.OWOIFY_ENABLE });
                const response = await this.fetchControlPanel(interaction, channel);
                return (<Message>interaction.message).edit(response);
            }
            case MarkovButtonType.WIPE: {
                const message = <Message>interaction.message;
                this.toggleMessageComponents(message, true);
                return await interaction.editReply({
                    ...(message.content && { content: message.content }),
                    embeds: [...message.embeds, MarkovEmbedFactory.getWipeConfirmEmbed(this, interaction, channel)],
                    components: [...message.components, new MessageActionRow().addComponents(
                        MarkovButtonFactory.getMarkovButton(this, <GuildChannel>message.channel, MarkovButtonType.BACKOUT),
                        MarkovButtonFactory.getMarkovButton(this, <GuildChannel>message.channel, MarkovButtonType.WIPE_CONFIRMED)
                    )],
                });
            }
            case MarkovButtonType.WIPE_CONFIRMED: {
                await this.database.deleteStrings(channel);
                const message = <Message>interaction.message;
                this.toggleMessageComponents(message, false);
                const response = await this.fetchControlPanel(interaction, channel);
                return (<Message>interaction.message).edit(response);
            }
            case MarkovButtonType.PURGE_CONFIRMED: {
                await this.database.purge(interaction.guild!);
                const message = <Message>interaction.message;
                this.toggleMessageComponents(message, false);
                return await message.edit({
                    ...(message.content && { content: message.content }),
                    embeds: [...message.embeds.slice(0, -1), MarkovEmbedFactory.getPurgedEmbed(this, interaction)],
                    components: message.components.slice(0, -1),
                });
            }
            case MarkovButtonType.BACKOUT: {
                const message = <Message>interaction.message;
                this.toggleMessageComponents(message, false);
                return await message.edit({
                    ...(message.content && { content: message.content }),
                    embeds: message.embeds.slice(0, -1),
                    components: message.components.slice(0, -1),
                });
            }
            default: { throw interaction }
        }
    };

    private async fetchControlPanel(context: HandlerContext, channel: GuildChannel): Promise<InteractionReplyOptions> {
        const totals = await this.database.fetchStringsTotals(channel);
        const channelData = await this.database.fetchChannel(channel);
        const embed = MarkovEmbedFactory.getControlPanel(this, context, channel, channelData, totals);
        const primaryRow = new MessageActionRow().addComponents([
            MarkovButtonFactory.getMarkovButton(this, channel, channelData.posting ? MarkovButtonType.POSTING_DISABLE : MarkovButtonType.POSTING_ENABLE),
            MarkovButtonFactory.getMarkovButton(this, channel, channelData.tracking ? MarkovButtonType.TRACKING_DISABLE : MarkovButtonType.TRACKING_ENABLE),
            MarkovButtonFactory.getMarkovButton(this, channel, MarkovButtonType.WIPE)
        ]);
        const secondaryRow = new MessageActionRow().addComponents([
            MarkovButtonFactory.getMarkovButton(this, channel, channelData.mentions ? MarkovButtonType.MENTIONS_DISABLE : MarkovButtonType.MENTIONS_ENABLE),
            MarkovButtonFactory.getMarkovButton(this, channel, channelData.links ? MarkovButtonType.LINKS_DISABLE : MarkovButtonType.LINKS_ENABLE),
            MarkovButtonFactory.getMarkovButton(this, channel, channelData.owoify ? MarkovButtonType.OWOIFY_DISABLE : MarkovButtonType.OWOIFY_ENABLE)
        ]);
        return { embeds: [embed], components: [primaryRow, secondaryRow] };
    }

    public async fetchMarkovResponse(channel: GuildChannel, user: User | null): Promise<InteractionReplyOptions | null> {
        const rows = await this.database.fetchStrings(channel, user ? user : undefined);
        const channelData = await this.database.fetchChannel(channel);
        if (!rows.length) return null;
        const markov = new Markov({ stateSize: rows.length < 1000 ? 1 : 2 });
        markov.addData(rows.map(row => row.content));

        return new Promise((resolve, reject) => {
            if (!rows.length) return reject();
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
            return { content: content, ...(channelData.mentions && { allowedMentions: { parse: [] } }) };
        }).catch(() => {
            return null;
        });
    }

    private toggleMessageComponents(message: Message, disabled: boolean) {
        message.components.forEach(actionRow => {
            actionRow.components.forEach(component => {
                component.setDisabled(disabled);
            })
        })
    }

    public override async disable(context: HandlerContext, customData?: MarkovCustomData): Promise<ApplicationCommand | null> {
        const hasData = await this.database.hasData(context.guild!);
        if (hasData && context instanceof ButtonInteraction) {
            const message = <Message>context.message;
            this.toggleMessageComponents(message, true);
            await context.editReply({
                ...(message.content && { content: message.content }),
                embeds: [...message.embeds, MarkovEmbedFactory.getPurgeConfirmEmbed(this, context)],
                components: [...message.components, new MessageActionRow().addComponents(
                    MarkovButtonFactory.getMarkovButton(this, <GuildChannel>message.channel, MarkovButtonType.BACKOUT),
                    MarkovButtonFactory.getMarkovButton(this, <GuildChannel>message.channel, MarkovButtonType.PURGE_CONFIRMED)
                )],
            });
            return null;
        }
        await this.database.purge(context.guild!);
        return super.disable(context, customData);
    }

    public override async setup(client: CommandClient): Promise<HandlerResult> {
        await this.database.setup().then(() => true);
        client.on('messageCreate', (message) => this.onMessageCreate(message));
        client.on('messageUpdate', (_oldMessage, newMessage) => this.onMessageCreate(<Message>newMessage));
        setInterval(() => {
            return client.guilds.cache.forEach(async guild => {
                const rows = await this.database.fetchAllChannels(guild);
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
        if (message.guild && await this.fetchCommand(message.guild)) {
            const row = await this.database.fetchChannel(<GuildChannel>message.channel);
            if (row.tracking) await this.database.setStrings(message);
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
