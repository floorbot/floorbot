import { ChatInputCommandInteraction, Events, Message, MessageComponentInteraction, MessageMentions, ModalSubmitInteraction } from 'discord.js';
import { ChatInputCommandHandler, HandlerClient } from 'discord.js-handlers';
import { Pool } from 'mariadb';
import { owoify } from 'owoifyx';
import { Util } from '../../discord/Util.js';
import { MarkovButtonId, MarkovSelectMenuId, MarkovSettingsSelectMenuOptionValue } from './builders/MarkovMessageActionRowBuilder.js';
import { MarkovTextInputId } from './builders/MarkovModalActionRowBuilder.js';
import { MarkovModalId, MarkovReplyBuilder } from './builders/MarkovReplyBuilder.js';
import { MarkovChatInputCommandData } from './MarkovChatInputCommandData.js';
import { MarkovSettingsRow, MarkovSettingsTable } from './tables/MarkovSettingsTable.js';
import { MarkovStateTable } from './tables/MarkovStateTable.js';

export class MarkovChatInputCommandHandler extends ChatInputCommandHandler {

    private static readonly LinksPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    private readonly settingsTable: MarkovSettingsTable;
    private readonly stateTable: MarkovStateTable;

    constructor({ pool }: { pool: Pool; }) {
        super(MarkovChatInputCommandData);
        this.settingsTable = new MarkovSettingsTable(pool);
        this.stateTable = new MarkovStateTable(pool);
    }

    public async run(command: ChatInputCommandInteraction): Promise<any> {
        if (!command.inGuild()) return await command.reply(new MarkovReplyBuilder(command).addGuildOnlyEmbed({ command }));
        await command.deferReply();

        let settings = await this.settingsTable.selectChannel({ guild_id: command.guildId, channel_id: command.channelId });
        let totals = await this.stateTable.selectStateTotals({ channel_id: command.channelId });
        const replyOptions = new MarkovReplyBuilder(command)
            .addControlPanelEmbed({ settings, totals })
            .addControlPanelComponents({ settings });
        const message = await command.followUp(replyOptions);
        const collector = Util.createComponentCollector(command.client, message);
        collector.on('collect', async (interaction: MessageComponentInteraction | ModalSubmitInteraction) => {
            if (interaction.isMessageComponent() && !Util.isAdminOrOwner(interaction, command)) {
                const replyOptions = new MarkovReplyBuilder(interaction)
                    .addAdminOrOwnerEmbed({ command, component: interaction });
                return await interaction.reply(replyOptions);
            }
            switch (interaction.customId) {
                case MarkovButtonId.EditFrequencies: {
                    if (!interaction.isMessageComponent()) return;
                    const modalBuilder = MarkovReplyBuilder.getFrequenciesModal({ settings });
                    return await interaction.showModal(modalBuilder);
                }
                case MarkovModalId.Frequencies: {
                    if (!interaction.isModalSubmit()) return;
                    await interaction.deferUpdate();
                    const messagesValue = interaction.fields.getTextInputValue(MarkovTextInputId.Messages);
                    const minutesValue = interaction.fields.getTextInputValue(MarkovTextInputId.Minutes);
                    const messages = messagesValue.length ? Math.max(parseInt(messagesValue), 5) : MarkovSettingsTable.DEFAULT_MESSAGES;
                    const minutes = minutesValue.length ? Math.abs(parseInt(minutesValue)) : MarkovSettingsTable.DEFAULT_MINUTES;
                    settings = await this.settingsTable.insertChannel({ guild_id: settings.guild_id, channel_id: settings.channel_id, ...(!isNaN(messages) && { messages }), ...(!isNaN(minutes) && { minutes }) });
                    break;
                }
                case MarkovButtonId.DeleteData: {
                    if (!interaction.isMessageComponent()) return;
                    const modalBuilder = MarkovReplyBuilder.getDeleteMarkovDataModal({ messageCheck: 'yes' });
                    return await interaction.showModal(modalBuilder);
                }
                case MarkovModalId.ConfirmDeleteData: {
                    if (!interaction.isModalSubmit()) return;
                    const messageCheck = interaction.fields.getTextInputValue(MarkovTextInputId.ConfirmMessage);
                    if (messageCheck !== 'yes') return;
                    await interaction.deferUpdate();
                    await this.settingsTable.delete({ channel_id: settings.channel_id });
                    await this.stateTable.delete({ channel_id: settings.channel_id });
                    settings = settings = await this.settingsTable.selectChannel({ guild_id: command.guildId, channel_id: command.channelId });
                    totals = await this.stateTable.selectStateTotals({ channel_id: command.channelId });
                    break;
                }
                case MarkovSelectMenuId.Settings: {
                    if (!interaction.isSelectMenu()) return;
                    await interaction.deferUpdate();
                    const posting = interaction.values.includes(MarkovSettingsSelectMenuOptionValue.Posting);
                    const tracking = interaction.values.includes(MarkovSettingsSelectMenuOptionValue.Tracking);
                    const owoify = interaction.values.includes(MarkovSettingsSelectMenuOptionValue.Owoify);
                    const bots = interaction.values.includes(MarkovSettingsSelectMenuOptionValue.Bots);
                    settings = await this.settingsTable.insertChannel({ guild_id: settings.guild_id, channel_id: settings.channel_id, posting, tracking, owoify, bots });
                    break;
                }
                case MarkovSelectMenuId.Mentions: {
                    if (!interaction.isSelectMenu()) return;
                    await interaction.deferUpdate();
                    const mentionsPolicy = (interaction.values[0] as MarkovSettingsRow['mentions']) ?? settings.mentions;
                    settings = await this.settingsTable.insertChannel({ guild_id: settings.guild_id, channel_id: settings.channel_id, mentions: mentionsPolicy });
                    break;
                }
                case MarkovSelectMenuId.Links: {
                    if (!interaction.isSelectMenu()) return;
                    await interaction.deferUpdate();
                    const linksPolicy = (interaction.values[0] as MarkovSettingsRow['links']) ?? settings.links;
                    settings = await this.settingsTable.insertChannel({ guild_id: settings.guild_id, channel_id: settings.channel_id, links: linksPolicy });
                    break;
                }
            }
            const replyOptions = new MarkovReplyBuilder(command)
                .addControlPanelEmbed({ settings, totals })
                .addControlPanelComponents({ settings });
            return interaction.editReply(replyOptions);
        });
    }

    public async generateMarkov({ guildId, channelId }: { guildId: string, channelId: string; }): Promise<MarkovReplyBuilder | null> {
        const settings = await this.settingsTable.selectChannel({ guild_id: guildId, channel_id: channelId });
        const options = {
            channel_id: settings.channel_id,
            ...(settings.bots === false && { bot: false }),
            ...(settings.mentions === 'disable' && { mention: true }),
            ...(settings.links === 'disable' && { link: true })
        };
        for (let i = 0; i < 100; i++) {
            let state = await this.stateTable.selectRandomState({ ...options, current_state: null });
            const states = [state];
            const words = [];
            if (state) words.push(state.next_value);
            while (state && state.next_value) {
                state = await this.stateTable.selectRandomState({ ...options, current_state: [words[words.length - 2], words[words.length - 1]].filter(part => part).join(' ') });
                if (state) words.push(state.next_value);
                states.push(state);
            }
            let markov = words.join(' ');
            if (!markov.length) continue;
            if (settings.links === 'substitute') markov = markov.replaceAll(MarkovChatInputCommandHandler.LinksPattern, '[LINK]');
            if (settings.mentions === 'substitute') {
                markov = markov.replaceAll(new RegExp(MessageMentions.ChannelsPattern, 'g'), '[CHANNEL]');
                markov = markov.replaceAll(new RegExp(MessageMentions.EveryonePattern, 'g'), '[EVERYONE]');
                markov = markov.replaceAll(new RegExp(MessageMentions.RolesPattern, 'g'), '[ROLE]');
                markov = markov.replaceAll(new RegExp(MessageMentions.UsersPattern, 'g'), '[USER]');
            }
            if (settings.owoify) markov = owoify(markov);
            const replyOptions = new MarkovReplyBuilder()
                .setContent(markov);
            if (settings.links === 'suppress') replyOptions.suppressEmbeds();
            if (settings.mentions === 'suppress') replyOptions.suppressMentions();
            return replyOptions;
        }
        return null;
    }

    private async storeMessage(message: Message): Promise<void> {
        if (!message.inGuild() || !message.content.length) return;
        const settings = await this.settingsTable.selectChannel({ guild_id: message.guildId, channel_id: message.channelId });
        if (settings.tracking) {
            if (message.editedTimestamp) await this.stateTable.delete({ channel_id: message.channelId, message_id: message.id });
            const split = [...message.content.split(' ').filter(part => part), null];
            for (const [i, part] of split.entries()) {
                const state = [split[i - 2], split[i - 1]].filter(part => part).join(' ') || null;
                await this.stateTable.insert({
                    epoch: message.createdTimestamp,
                    user_id: message.author.id,
                    guild_id: message.guildId,
                    channel_id: message.channelId,
                    message_id: message.id,
                    message_part: i,
                    current_state: state,
                    next_value: part,
                    bot: message.author.bot,
                    link: Boolean(part && MarkovChatInputCommandHandler.LinksPattern.test(part)),
                    mention: Boolean(part && (
                        MessageMentions.ChannelsPattern.test(part) ||
                        MessageMentions.EveryonePattern.test(part) ||
                        MessageMentions.RolesPattern.test(part) ||
                        MessageMentions.UsersPattern.test(part)
                    ))
                });
            }
        }
        if (settings.posting && !message.editedTimestamp) {
            if (message.mentions.users.has(message.client.user.id) && !message.author.bot) {
                await message.channel.sendTyping();
                const replyOptions = await this.generateMarkov({ guildId: message.guildId, channelId: message.channelId });
                if (replyOptions) await message.reply(replyOptions);
            }
            const random = Math.floor(Math.random() * settings.messages);
            if (!random) {
                await message.channel.sendTyping();
                const replyOptions = await this.generateMarkov({ guildId: message.guildId, channelId: message.channelId });
                if (replyOptions) await message.channel.send(replyOptions);
            }
        }
    }

    public override async setup({ client }: { client: HandlerClient; }): Promise<any> {
        const setup = await super.setup({ client });
        await this.settingsTable.createTable();
        await this.stateTable.createTable();
        client.on(Events.MessageCreate, (message) => this.storeMessage(message));
        client.on(Events.MessageUpdate, (_oldMessage, newMessage) => { if (newMessage instanceof Message) this.storeMessage(newMessage); });
        setInterval(async () => {
            for (const [guildId, _guild] of client.guilds.cache) {
                const rows = await this.settingsTable.select({ guild_id: guildId, posting: true });
                for (const row of rows) {
                    const channel = await client.channels.fetch(row.channel_id);
                    if (!channel || !channel.isTextBased()) return;
                    const random = Math.floor(Math.random() * row.minutes);
                    if (!random) {
                        await channel.sendTyping();
                        const replyOptions = await this.generateMarkov({ guildId, channelId: channel.id });
                        if (replyOptions) await channel.send(replyOptions);
                    }
                }
            }
        }, 1000 * 60); // Every minute
        return setup;
    }
}
