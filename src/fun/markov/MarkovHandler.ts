import { ApplicationCommandData, CommandInteraction, ApplicationCommand, Message, ButtonInteraction, MessageActionRow, User, GuildChannel, GuildMember, TextChannel } from 'discord.js';
import { CommandClient, BaseHandler, CommandHandler, HandlerContext, BaseHandlerOptions, ButtonHandler } from 'discord.js-commands';
import { MarkovCommandData } from './MarkovCommandData';
import { MarkovDatabase } from './MarkovDatabase';
import Markov from 'markov-strings';
import { Pool } from 'mariadb';


import { MarkovButton, MarkovCustomData, MarkovButtonFunction } from './message/MarkovButton';
import { ControlPanelEmbed } from './message/embeds/ControlPanelEmbed';
import { MarkovEmbed } from './message/embeds/MarkovEmbed';

export interface MarkovHandlerOptions extends BaseHandlerOptions {
    pool: Pool
}

export class MarkovHandler extends BaseHandler implements CommandHandler, ButtonHandler {

    public readonly commandData: ApplicationCommandData;
    public readonly database: MarkovDatabase;
    public readonly isGlobal: boolean;

    constructor(client: CommandClient, options: MarkovHandlerOptions) {
        super(client, { id: 'markov', name: 'Markov', group: 'Fun', nsfw: false });
        this.database = new MarkovDatabase(options.pool, 20, 1);
        this.commandData = MarkovCommandData;
        this.isGlobal = false;
        this.client.on('messageCreate', (message) => this.onMessageCreate(message));
        this.client.on('messageUpdate', (_oldMessage, newMessage) => this.onMessageCreate(<Message>newMessage));
        setInterval(() => {
            return this.client.guilds.cache.forEach(async guild => {
                const rows = await this.database.fetchAllChannels(guild);
                return rows.filter(row => {
                    return row.enabled;
                }).forEach(async data => {
                    const channel = <TextChannel>(await this.client.channels.fetch(<any>data.channel_id))!;
                    const random = Math.floor(Math.random() / data.hour * 10)
                    if (!random) {
                        const response = await this.fetchMarkovResponse(channel, null);
                        if (response) await channel.send(response);
                    }
                })
            })
        }, 1000 * 60 * 6) // Every 6 minutes (10 times an hour)
    }

    public async onButton(interaction: ButtonInteraction, customData: any): Promise<any> {
        await interaction.deferUpdate();

        const data = <MarkovCustomData>customData;
        const member = <GuildMember>interaction.member;
        const channel = <GuildChannel>(await this.client.channels.fetch(<any>data.channel))!;

        switch (data.fn) {
            case MarkovButtonFunction.ENABLE:
            case MarkovButtonFunction.DISABLE: {
                if (!this.isAdmin(member)) return interaction.reply(MarkovEmbed.getMissingAdminEmbed(interaction).toReplyOptions(true))
                const channelData = await this.database.setChannel(channel, { enabled: data.fn === 'enable' });
                const totals = await this.database.fetchStringsTotals(channel);
                const embed = new ControlPanelEmbed(interaction, channel, channelData, totals);
                const actionRow = new MessageActionRow().addComponents([
                    new MarkovButton(channel, channelData.enabled ? MarkovButtonFunction.DISABLE : MarkovButtonFunction.ENABLE),
                    new MarkovButton(channel, MarkovButtonFunction.WIPE)
                ]);
                return (<Message>interaction.message).edit({ embeds: [embed], components: [actionRow] });
            }
            case MarkovButtonFunction.WIPE: {
                if (!this.isAdmin(member)) return interaction.reply(MarkovEmbed.getMissingAdminEmbed(interaction).toReplyOptions(true))
                const message = <Message>interaction.message;
                this.toggleMessageComponents(message, true);
                return await interaction.editReply({
                    ...(message.content && { content: message.content }),
                    embeds: [...message.embeds, MarkovEmbed.getWipeConfirmEmbed(interaction, channel)],
                    components: [...message.components, new MessageActionRow().addComponents(
                        new MarkovButton(message.channel, MarkovButtonFunction.BACKOUT),
                        new MarkovButton(message.channel, MarkovButtonFunction.WIPE_CONFIRMED)
                    )],
                });
            }
            case MarkovButtonFunction.WIPE_CONFIRMED: {
                if (!this.isAdmin(member)) return interaction.reply(MarkovEmbed.getMissingAdminEmbed(interaction).toReplyOptions(true))
                await this.database.deleteStrings(channel);
                const message = <Message>interaction.message;
                const channelData = await this.database.fetchChannel(channel);
                const totals = await this.database.fetchStringsTotals(channel);
                const embed = new ControlPanelEmbed(interaction, channel, channelData, totals);
                this.toggleMessageComponents(message, false);
                const actionRow = new MessageActionRow().addComponents([
                    new MarkovButton(channel, channelData.enabled ? MarkovButtonFunction.DISABLE : MarkovButtonFunction.ENABLE),
                    new MarkovButton(channel, MarkovButtonFunction.WIPE)
                ]);
                return (<Message>interaction.message).edit({ embeds: [embed], components: [actionRow] });
            }
            case MarkovButtonFunction.PURGE_CONFIRMED: {
                if (!this.isAdmin(member)) return interaction.reply(MarkovEmbed.getMissingAdminEmbed(interaction).toReplyOptions(true));
                await this.database.purge(interaction.guild!);
                const message = <Message>interaction.message;
                this.toggleMessageComponents(message, false);
                return await message.edit({
                    ...(message.content && { content: message.content }),
                    embeds: [...message.embeds.slice(0, -1), MarkovEmbed.getPurgedEmbed(interaction)],
                    components: message.components.slice(0, -1),
                });
            }
            case MarkovButtonFunction.BACKOUT: {
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

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();

        const member = <GuildMember>interaction.member;
        const subCommand = interaction.options.first()!;
        const channel: GuildChannel = subCommand.options && subCommand.options.has('channel') ? <GuildChannel>subCommand.options.get('channel')!.channel : <GuildChannel>interaction.channel;

        if (interaction.options.has('settings')) {
            if (!this.isAdmin(member)) return interaction.reply(MarkovEmbed.getMissingAdminEmbed(interaction).toReplyOptions(true))
            const channelData = await this.database.fetchChannel(channel);
            const totals = await this.database.fetchStringsTotals(channel);
            const embed = new ControlPanelEmbed(interaction, channel, channelData, totals);
            const actionRow = new MessageActionRow().addComponents([
                new MarkovButton(channel, channelData.enabled ? MarkovButtonFunction.DISABLE : MarkovButtonFunction.ENABLE),
                new MarkovButton(channel, MarkovButtonFunction.WIPE)
            ]);
            return interaction.followUp({ embeds: [embed], components: [actionRow] });
        }

        if (interaction.options.has('frequency')) {
            if (!this.isAdmin(member)) return interaction.reply(MarkovEmbed.getMissingAdminEmbed(interaction).toReplyOptions(true))
            const perMessages: number | undefined = subCommand.options && subCommand.options.has('messages') ? <number>subCommand.options.get('messages')!.value : undefined;
            const perHour: number | undefined = subCommand.options && subCommand.options.has('hour') ? <number>subCommand.options.get('hour')!.value : undefined;
            const channelData = await this.database.setChannel(channel, { messages: perMessages, hour: perHour });
            const totals = await this.database.fetchStringsTotals(channel);
            const embed = new ControlPanelEmbed(interaction, channel, channelData, totals);
            const actionRow = new MessageActionRow().addComponents([
                new MarkovButton(channel, channelData.enabled ? MarkovButtonFunction.DISABLE : MarkovButtonFunction.ENABLE),
                new MarkovButton(channel, MarkovButtonFunction.WIPE)
            ]);
            return interaction.followUp({ embeds: [embed], components: [actionRow] });
        }

        if (interaction.options.has('generate')) {
            const user = subCommand.options && subCommand.options.has('user') ? subCommand.options.get('user')!.user! : null;
            const response = await this.fetchMarkovResponse(channel, user);
            return interaction.followUp(response ? { content: response } : MarkovEmbed.getFailedEmbed(interaction, channel, user).toReplyOptions());
        }

        throw interaction;
    }

    public async fetchMarkovResponse(channel: GuildChannel, user: User | null): Promise<string | null> {
        const rows = await this.database.fetchStrings(channel, user ? user : undefined);
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
                    result.string.split(' ').length > minLength
                )
            });
            return resolve(res);
        }).then((res: any) => {
            return res.string;
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

    public async disable(context: HandlerContext): Promise<ApplicationCommand | null> {
        const hasData = await this.database.hasData(context.guild!);
        if (hasData && context instanceof ButtonInteraction) {
            const message = <Message>context.message;
            this.toggleMessageComponents(message, true);
            await context.editReply({
                ...(message.content && { content: message.content }),
                embeds: [...message.embeds, MarkovEmbed.getPurgeConfirmEmbed(context)],
                components: [...message.components, new MessageActionRow().addComponents(
                    new MarkovButton(message.channel, MarkovButtonFunction.BACKOUT),
                    new MarkovButton(message.channel, MarkovButtonFunction.PURGE_CONFIRMED)
                )],
            });
            return null;
        }
        await this.database.purge(context.guild!);
        return super.disable(context);
    }

    public async setup(): Promise<any> {
        return this.database.setup().then(() => true);
    }

    private async onMessageCreate(message: Message) {
        if (message.guild && await this.isEnabled(message.guild)) {
            await this.database.setStrings(message);
            const row = await this.database.fetchChannel(<GuildChannel>message.channel);
            if (row.enabled) {
                const random = Math.floor(Math.random() * row.messages)
                if (!random) {
                    const response = await this.fetchMarkovResponse(<GuildChannel>message.channel, null);
                    if (response) await message.channel.send(response);
                }
            }
        }
    }
}
