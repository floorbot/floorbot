import { ApplicationCommandData, CommandInteraction, ApplicationCommand, Message, ButtonInteraction, Channel, MessageActionRow, User, InteractionReplyOptions, GuildChannel, GuildMember } from 'discord.js';
import { CommandClient, BaseHandler, CommandHandler, HandlerContext, BaseHandlerOptions, ButtonHandler } from 'discord.js-commands';
import { MarkovCommandData } from './MarkovCommandData';
import Markov from 'markov-strings';
import { Pool } from 'mariadb';

import { MarkovDatabase } from './MarkovDatabase';

import { MarkovButton, MarkovCustomData } from './message/MarkovButton';
import { MissingAdminEmbed } from './message/embeds/MissingAdminEmbed';
import { ConfirmEmbed } from './message/embeds/ConfirmEmbed';
import { FailedEmbed } from './message/embeds/FailedEmbed';
import { PurgedEmbed } from './message/embeds/PurgedEmbed';
import { StatusEmbed } from './message/embeds/StatusEmbed';

export interface MarkovHandlerOptions extends BaseHandlerOptions {
    pool: Pool
}

export class MarkovHandler extends BaseHandler implements CommandHandler, ButtonHandler {

    public readonly commandData: ApplicationCommandData;
    public readonly database: MarkovDatabase;
    public readonly isGlobal: boolean;

    constructor(client: CommandClient, options: MarkovHandlerOptions) {
        super(client, { id: 'markov', name: 'Markov', group: 'Fun', nsfw: false });
        this.database = new MarkovDatabase(options.pool, 20);
        this.commandData = MarkovCommandData;
        this.isGlobal = false;
        this.client.on('messageCreate', (message) => this.onMessageCreate(message));
        this.client.on('messageUpdate', (_oldMessage, newMessage) => this.onMessageCreate(<Message>newMessage));
    }

    public async onButton(interaction: ButtonInteraction, customData: any): Promise<any> {
        const data = <MarkovCustomData>customData;
        const member = <GuildMember>interaction.member;
        if (!this.isAdmin(member)) return interaction.reply(new MissingAdminEmbed(interaction, data.fn).toReplyOptions(true))
        const channel = <GuildChannel>(await this.client.channels.fetch(<any>data.channel))!;
        await interaction.deferUpdate();
        switch (data.fn) {
            case 'enable': {
                const row = await this.database.setChannel(channel, { enabled: true });
                const total = await this.database.fetchStringsTotal(channel);
                const embed = new StatusEmbed(interaction, { channel: channel, total: total, ...row, message: `Markov has been enabled for ${channel} 🥳`, wipe: data.wipe });
                const cancelButton = new MarkovButton(channel, 'cancel');
                const wipeButton = new MarkovButton(channel, 'wipe', true);
                const actionRow = new MessageActionRow().addComponents([cancelButton, wipeButton]);
                return (<Message>interaction.message).edit({ embeds: [embed], components: (data.wipe ? [actionRow] : []) });
            }
            case 'disable': {
                const row = await this.database.setChannel(channel, { enabled: false });
                const total = await this.database.fetchStringsTotal(channel);
                const embed = new StatusEmbed(interaction, { channel: channel, total: total, ...row, message: `Markov has been disabled for ${channel} 😟`, wipe: data.wipe });
                const cancelButton = new MarkovButton(channel, 'cancel');
                const wipeButton = new MarkovButton(channel, 'wipe', true);
                const actionRow = new MessageActionRow().addComponents([cancelButton, wipeButton]);
                return (<Message>interaction.message).edit({ embeds: [embed], components: (data.wipe ? [actionRow] : []) });
            }
            case 'wipe': {
                await this.database.deleteStrings(channel);
                const row = await this.database.fetchChannel(channel);
                const total = await this.database.fetchStringsTotal(channel);
                const embed = new StatusEmbed(interaction, { channel: channel, total: total, ...row, message: `All saved messages for ${channel} have been wiped 🤯` });
                return (<Message>interaction.message).edit({ embeds: [embed], components: [] });
            }
            case 'cancel': {
                const row = await this.database.fetchChannel(channel);
                const total = await this.database.fetchStringsTotal(channel);
                const embed = new StatusEmbed(interaction, { channel: channel, total: total, ...row, message: `These are the current stats for ${channel}` });
                return (<Message>interaction.message).edit({ embeds: [embed], components: [] });
            }
            case 'purge-confirm': {
                const message = <Message>interaction.message;
                this.toggleMessageComponents(message, false);
                await super.disable(interaction);
                await this.database.purge(interaction.guild!);
                return await message.edit({
                    ...(message.content && { content: message.content }),
                    embeds: [...message.embeds.slice(0, -1), new PurgedEmbed(interaction)],
                    components: message.components.slice(0, -1),
                });
            }
            case 'purge-backout': {
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
        const member = <GuildMember>interaction.member;
        const subCommand = interaction.options.first()!;

        if (!['generate'].includes(subCommand.name) && !this.isAdmin(member)) {
            return interaction.reply(new MissingAdminEmbed(interaction, subCommand.name).toReplyOptions(true));
        }

        await interaction.defer();
        const channel: GuildChannel = subCommand.options && subCommand.options.has('channel') ? <GuildChannel>subCommand.options.get('channel')!.channel : <GuildChannel>interaction.channel;
        if (interaction.options.has('enable')) {
            const embed = new ConfirmEmbed(interaction, 'enable', channel);
            const actionRow = new MessageActionRow().addComponents([
                new MarkovButton(channel, 'cancel'),
                new MarkovButton(channel, 'enable', false),
                new MarkovButton(channel, 'enable', true)
            ]);
            return interaction.followUp({ embeds: [embed], components: [actionRow] });
        }

        if (interaction.options.has('disable')) {
            const embed = new ConfirmEmbed(interaction, 'disable', channel);
            const actionRow = new MessageActionRow().addComponents([
                new MarkovButton(channel, 'cancel'),
                new MarkovButton(channel, 'disable', false),
                new MarkovButton(channel, 'disable', true)
            ]);
            return interaction.followUp({ embeds: [embed], components: [actionRow] });
        }

        if (interaction.options.has('wipe')) {
            const embed = new ConfirmEmbed(interaction, 'wipe', channel);
            const actionRow = new MessageActionRow().addComponents([
                new MarkovButton(channel, 'cancel'),
                new MarkovButton(channel, 'wipe', true)
            ]);
            return interaction.followUp({ embeds: [embed], components: [actionRow] });
        }

        if (interaction.options.has('frequency')) {
            const frequency: number = subCommand.options && subCommand.options.has('ratio') ? <number>subCommand.options.get('ratio')!.value : 20;
            const row = await this.database.setChannel(channel, { frequency: frequency });
            const total = await this.database.fetchStringsTotal(channel);
            const embed = new StatusEmbed(interaction, { channel: channel, total: total, ...row, message: `Changed frequency to ${row.frequency} in ${channel}` });
            return interaction.followUp({ embeds: [embed], components: [] });
        }

        if (interaction.options.has('generate')) {
            const user = subCommand.options && subCommand.options.has('user') ? subCommand.options.get('user')!.user! : null;
            const response = await this.fetchResponse(interaction, user);
            return interaction.followUp(response);
        }

        throw interaction;
    }

    public async fetchResponse(context: HandlerContext, user: User | null): Promise<InteractionReplyOptions> {
        const rows = await this.database.fetchStrings(<GuildChannel>context.channel, user ? user : undefined)
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
            return { content: res.string };
        }).catch(() => {
            const embed = new FailedEmbed(context, <Channel>context.channel, user);
            return { embeds: [embed] };
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
                embeds: [...message.embeds, new ConfirmEmbed(context, 'purge', <GuildChannel>message.channel)],
                components: [...message.components, new MessageActionRow().addComponents(
                    new MarkovButton(message.channel, 'purge-backout', true),
                    new MarkovButton(message.channel, 'purge-confirm', true)
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
                const random = Math.floor(Math.random() * row.frequency)
                if (!random) {
                    const response = await this.fetchResponse(message, null);
                    if (response.content) await message.channel.send(response);
                }
            }
        }
    }
}
