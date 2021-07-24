import { CommandInteraction, Message, ButtonInteraction, MessageActionRow, User, GuildChannel, TextChannel, InteractionReplyOptions, Guild, ApplicationCommand } from 'discord.js';
import { GuildCommandHandler, MarkovDatabase, MarkovCommandData, MarkovEmbedFactory, GuildCommandHandlerGroup, MarkovButtonFactory } from '../../..';
import { CommandClient, HandlerContext, HandlerResult, HandlerCustomData, ButtonHandler } from 'discord.js-commands';
import Markov from 'markov-strings';
import { PoolConfig } from 'mariadb';

export enum MarkovButtonType {
    POSTING_ENABLE = 'Enable Posting',
    POSTING_DISABLE = 'Disable Posting',
    TRACKING_ENABLE = 'Enable Tracking',
    TRACKING_DISABLE = 'Disable Tracking',
    LINKS_ENABLE = 'Enable Links',
    LINKS_DISABLE = 'Disable Links',
    MENTIONS_ENABLE = 'Enable Mentions',
    MENTIONS_DISABLE = 'Disable Mentions',
    WIPE = 'Wipe Data',
    WIPE_CONFIRMED = 'Confirm Wipe Data',
    PURGE_CONFIRMED = 'Purge All Data',
    BACKOUT = 'Backout'
}

export interface MarkovCustomData extends HandlerCustomData {
    readonly type: MarkovButtonType,
    readonly channel: string
}

export class MarkovHandler extends GuildCommandHandler implements ButtonHandler<MarkovCustomData> {

    public readonly database: MarkovDatabase;
    public readonly buttonFactory: MarkovButtonFactory;
    public readonly embedFactory: MarkovEmbedFactory;

    constructor(poolConfig: PoolConfig) {
        super({ commandData: MarkovCommandData, group: GuildCommandHandlerGroup.FUN, id: 'markov' });
        this.database = new MarkovDatabase(poolConfig, 20, 1);
        this.buttonFactory = new MarkovButtonFactory(this);
        this.embedFactory = new MarkovEmbedFactory(this);
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        const subCommand = interaction.options.getSubCommand();
        const channel = (interaction.options.getChannel('channel') || interaction.channel) as GuildChannel;
        if (!this.isAdmin(interaction) && !['generate'].includes(subCommand)) return interaction.reply(this.embedFactory.getMissingAdminEmbed(interaction).toReplyOptions(true))
        await interaction.defer();
        switch (subCommand) {
            case 'settings': {
                const response = await this.fetchControlPanel(interaction, channel);
                return interaction.followUp(response);
            }
            case 'frequency': {
                const perMessages = interaction.options.getInteger('messages') || undefined;
                const perMinutes = interaction.options.getInteger('minutes') || undefined;
                await this.database.setChannel(channel, { messages: perMessages, minutes: perMinutes });
                const response = await this.fetchControlPanel(interaction, channel);
                return interaction.followUp(response);
            }
            case 'generate': {
                const user = interaction.options.getUser('user');
                const response = await this.fetchMarkovResponse(channel, user);
                return interaction.followUp(response ? response : this.embedFactory.getFailedEmbed(interaction, channel, user).toReplyOptions());
            }
            default: throw interaction;
        }
    }

    public async onButton(interaction: ButtonInteraction, customData: MarkovCustomData): Promise<any> {
        if (!this.isAdmin(interaction)) return interaction.reply(this.embedFactory.getMissingAdminEmbed(interaction).toReplyOptions(true))
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
            case MarkovButtonType.WIPE: {
                const message = <Message>interaction.message;
                this.toggleMessageComponents(message, true);
                return await interaction.editReply({
                    ...(message.content && { content: message.content }),
                    embeds: [...message.embeds, this.embedFactory.getWipeConfirmEmbed(interaction, channel)],
                    components: [...message.components, new MessageActionRow().addComponents(
                        this.buttonFactory.getMarkovButton(<GuildChannel>message.channel, MarkovButtonType.BACKOUT),
                        this.buttonFactory.getMarkovButton(<GuildChannel>message.channel, MarkovButtonType.WIPE_CONFIRMED)
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
                    embeds: [...message.embeds.slice(0, -1), this.embedFactory.getPurgedEmbed(interaction)],
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
        const embed = this.embedFactory.getControlPanel(context, channel, channelData, totals);
        const primaryRow = new MessageActionRow().addComponents([
            this.buttonFactory.getMarkovButton(channel, channelData.posting ? MarkovButtonType.POSTING_DISABLE : MarkovButtonType.POSTING_ENABLE),
            this.buttonFactory.getMarkovButton(channel, channelData.tracking ? MarkovButtonType.TRACKING_DISABLE : MarkovButtonType.TRACKING_ENABLE),
            this.buttonFactory.getMarkovButton(channel, MarkovButtonType.WIPE)
        ]);
        const secondaryRow = new MessageActionRow().addComponents([
            this.buttonFactory.getMarkovButton(channel, channelData.mentions ? MarkovButtonType.MENTIONS_DISABLE : MarkovButtonType.MENTIONS_ENABLE),
            this.buttonFactory.getMarkovButton(channel, channelData.links ? MarkovButtonType.LINKS_DISABLE : MarkovButtonType.LINKS_ENABLE)
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
                filter: (result: any) => (
                    result.refs.length > 1 &&
                    result.string.split(' ').length > minLength &&
                    (channelData.links || !/(https?:\/\/[a-zA-Z]+)/g.test(result.string))
                )
            });
            return resolve(res);
        }).then((res: any) => {
            return { content: res.string, ...(channelData.mentions && { allowedMentions: { parse: [] } }) };
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

    public override async disable(guild: Guild, context: HandlerContext): Promise<ApplicationCommand | null> {
        const hasData = await this.database.hasData(guild);
        if (hasData && context instanceof ButtonInteraction) {
            const message = <Message>context.message;
            this.toggleMessageComponents(message, true);
            await context.editReply({
                ...(message.content && { content: message.content }),
                embeds: [...message.embeds, this.embedFactory.getPurgeConfirmEmbed(context)],
                components: [...message.components, new MessageActionRow().addComponents(
                    this.buttonFactory.getMarkovButton(<GuildChannel>message.channel, MarkovButtonType.BACKOUT),
                    this.buttonFactory.getMarkovButton(<GuildChannel>message.channel, MarkovButtonType.PURGE_CONFIRMED)
                )],
            });
            return null;
        }
        await this.database.purge(guild);
        return super.disable(guild, context);
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
