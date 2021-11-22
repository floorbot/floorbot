import { AutocompleteInteraction, Client, Collection, CommandInteraction, MessageComponentInteraction, TextChannel } from 'discord.js';
import { ChatInputHandler } from '../../../discord/handler/abstracts/ChatInputHandler.js';
import { HandlerClient } from '../../../discord/handler/HandlerClient.js';
import { HandlerUtil } from '../../../discord/handler/HandlerUtil.js';
import { DDDDatabase, DDDParticipantRow } from './db/DDDDatabase.js';
import { HandlerReplies } from '../../../helpers/HandlerReplies.js';
import { DDDButtonID, DDDReplies } from './replies/DDDReplies.js';
import { HandlerDB } from '../../../helpers/HandlerDatabase.js';
import { DDDCommandData } from './DDDCommandData.js';
import { DDDUtil } from './DDDUtil.js';
import Schedule from 'node-schedule';
import tzdata from 'tzdata';

export class DDDHandler extends ChatInputHandler {

    private static readonly ZONES = Object.keys(tzdata.zones);

    private readonly jobs: Map<string, Schedule.Job> = new Collection();
    private readonly database: DDDDatabase;
    private readonly replies: DDDReplies;

    constructor(db: HandlerDB) {
        super({ data: DDDCommandData, group: 'Event', global: false, nsfw: false });
        this.replies = new DDDReplies({ eventName: 'Destroy Dick December', eventAcronym: 'DDD' });
        this.database = new DDDDatabase(db);
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partial = interaction.options.getString('zone', true).toLowerCase();
        const suggestions = DDDHandler.ZONES.filter(zone => zone.toLowerCase().includes(partial));
        const options = suggestions.slice(0, 25).map(suggestion => ({ name: suggestion, value: suggestion }));
        return interaction.respond(options);
    }

    private async createSchedule(client: Client, participantRow: DDDParticipantRow) {
        const updated = await this.database.fetchParticipant(participantRow);
        if (!updated) return;
        participantRow = updated;
        const jobKey = `${participantRow.guild_id}-${participantRow.user_id}-${participantRow.year}`
        if (this.jobs.has(jobKey)) { this.deleteSchedule(participantRow) }

        const allNutRows = await this.database.fetchAllNuts(participantRow);
        const participantStats = DDDUtil.getParticipantStats(participantRow, allNutRows);
        const settingsRow = await this.database.fetchSettings(participantRow);
        const guild = client.guilds.cache.get(settingsRow.guild_id);
        const member = guild ? guild.members.cache.get(participantRow.user_id) : null;
        const channel = guild && settingsRow.channel_id ? (guild.channels.cache.get(settingsRow.channel_id) as TextChannel | null) : null;

        if (participantRow.failed === -1) {
            if (guild && member) {
                if (channel) {
                    const replyOptions = this.replies.createParticipantPassedReply(settingsRow, participantStats)
                    await channel.send(replyOptions).catch(() => { });
                }
                if (settingsRow.passing_role_id) await member.roles.remove(settingsRow.passing_role_id).catch(() => { });
                if (settingsRow.failed_role_id) await member.roles.add(settingsRow.failed_role_id).catch(() => { });
            }
            // wait that means he did the pass right? since no fails were found?
        } else if (!participantRow.failed) {
            if (participantStats.dayFailed) {
                participantRow = await this.database.setParticipant({ ...participantRow, failed: participantStats.dayFailed });
                if (guild && member) {
                    if (channel) {
                        const replyOptions = this.replies.createParticipantFailedReply(settingsRow, participantStats);
                        await channel.send(replyOptions).catch(() => { });
                    }
                    if (settingsRow.passing_role_id) await member.roles.remove(settingsRow.passing_role_id).catch(() => { });
                    if (settingsRow.failed_role_id) await member.roles.add(settingsRow.failed_role_id).catch(() => { });
                }
            } else {
                const midnight = participantStats.zoneDetails.nextMidnight;
                this.jobs.set(jobKey, Schedule.scheduleJob(midnight.toJSDate(), () => {
                    this.createSchedule(client, participantRow);
                }));
            }
        }
    }

    private async deleteSchedule(participantRow: DDDParticipantRow) {
        const jobKey = `${participantRow.guild_id}-${participantRow.user_id}-${participantRow.year}`
        const job = this.jobs.get(jobKey);
        if (job) {
            this.jobs.delete(jobKey);
            job.cancel();
        }
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {
        const { client, guild, member, channel } = command;
        const subCommand = command.options.getSubcommand();
        const eventDetails = DDDUtil.getEventDetails();
        switch (subCommand) {
            case 'leaderboard': {
                await command.deferReply();
                const allParticipantRows = await this.database.fetchAllParticipants(eventDetails.year);
                const allParticipantStats = [];
                for (const participantRow of allParticipantRows) {
                    const allNutRows = await this.database.fetchAllNuts(participantRow);
                    const participanStats = DDDUtil.getParticipantStats(participantRow, allNutRows);
                    allParticipantStats.push(participanStats);
                }
                const replyOptions = this.replies.createLeaderboardReply(command, eventDetails, allParticipantStats);
                return command.followUp(replyOptions);
            }
            case 'join': {
                await command.deferReply();
                const zone = command.options.getString('zone', true);
                const zoneDetails = DDDUtil.getZoneDetails(eventDetails, zone);
                const partialParticipant = { guild_id: member.guild.id, user_id: member.id, year: eventDetails.year };
                let participantRow = await this.database.fetchParticipant(partialParticipant);
                const participantZoneDetails = participantRow ? DDDUtil.getZoneDetails(eventDetails, participantRow.zone) : null;
                const allNutRows = await this.database.fetchAllNuts(partialParticipant);
                if (
                    (allNutRows.length) ||                                                // Already reported a DDD nut for current zone
                    (!zoneDetails || zoneDetails.isDecemberish) ||                        // New zone is invalid or has already begun DDD
                    (participantZoneDetails && participantZoneDetails.isDecemberish)      // Existing zone has already begun DDD
                ) { return command.followUp(this.replies.createJoinFailReply(command, eventDetails, zone, zoneDetails, participantZoneDetails, allNutRows)); }
                participantRow = await this.database.setParticipant({ ...partialParticipant, zone: zone, failed: 0 });
                this.createSchedule(client, participantRow);
                const settingsRow = await this.database.fetchSettings(partialParticipant);
                if (settingsRow.event_role_id) await member.roles.add(settingsRow.event_role_id).catch(() => { });
                if (settingsRow.passing_role_id) await member.roles.add(settingsRow.passing_role_id).catch(() => { });
                const replyOptions = this.replies.createJoinReply(command, eventDetails, zoneDetails);
                return command.followUp(replyOptions);
            }
            case 'leave': {
                await command.deferReply();
                const partialParticipant = { guild_id: member.guild.id, user_id: member.id, year: eventDetails.year };
                const participantRow = await this.database.fetchParticipant(partialParticipant);
                const participantZoneDetails = participantRow ? DDDUtil.getZoneDetails(eventDetails, participantRow.zone) : null;
                const allNutRows = await this.database.fetchAllNuts(partialParticipant);
                if (
                    (allNutRows.length) ||                                                // Already reported a DDD nut for current zone
                    (!participantZoneDetails || participantZoneDetails.isDecemberish)     // Existing Zone has already begun DDD or not joined
                ) { return command.followUp(this.replies.createLeaveFailReply(command, eventDetails, participantZoneDetails, allNutRows)); }
                await this.database.deleteParticipant(partialParticipant);
                this.deleteSchedule(participantRow!);
                const settingsRow = await this.database.fetchSettings(partialParticipant);
                if (settingsRow.event_role_id) await member.roles.remove(settingsRow.event_role_id).catch(() => { });
                if (settingsRow.passing_role_id) await member.roles.remove(settingsRow.passing_role_id).catch(() => { });
                const replyOptions = this.replies.createLeaveReply(command, eventDetails);
                return command.followUp(replyOptions);
            }
            case 'settings': {
                if (!(channel instanceof TextChannel)) return command.reply(this.replies.createNotTextChannelReply(command, eventDetails));
                await command.deferReply();
                const partialSettingsRow = { guild_id: guild.id, year: eventDetails.year };
                let settingsRow = await this.database.fetchSettings(partialSettingsRow);
                let participantRows = await this.database.fetchAllParticipants(partialSettingsRow);
                const replyOptions = this.replies.createSettingsReply(command, eventDetails, settingsRow, participantRows);
                const message = await command.followUp(replyOptions);
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', HandlerUtil.handleCollectorErrors(async (component: MessageComponentInteraction<'cached'>) => {
                    if (!HandlerUtil.isAdminOrOwner(component.member)) return component.reply(HandlerReplies.createAdminOrOwnerReply(command));
                    if (!component.isButton()) { throw component }
                    await component.deferUpdate();
                    switch (component.customId) {
                        case DDDButtonID.SET_EVENT_CHANNEL: {
                            settingsRow = await this.database.updateSettings({ ...partialSettingsRow, channel_id: channel.id });
                            break;
                        }
                        case DDDButtonID.CLEAR_EVENT_CHANNEL: {
                            settingsRow = await this.database.updateSettings({ ...partialSettingsRow, channel_id: null });
                            break;
                        }
                        case DDDButtonID.CREATE_EVENT_ROLE: {
                            if (settingsRow.event_role_id) return null;
                            const role = await guild.roles.create({ name: 'DDD Participant', mentionable: true, reason: `Created by ${component.user.tag}` });
                            participantRows = await this.database.fetchAllParticipants(partialSettingsRow);
                            settingsRow = await this.database.updateSettings({ ...partialSettingsRow, event_role_id: role.id });
                            for (const memberRow of participantRows) {
                                const member = guild.members.cache.get(memberRow.user_id);
                                if (member) await member.roles.add(settingsRow.event_role_id!);
                            }
                            break;
                        }
                        case DDDButtonID.DELETE_EVENT_ROLE: {
                            if (!settingsRow.event_role_id) break;
                            const role = await guild.roles.fetch(settingsRow.event_role_id);
                            if (role) await role.delete(`Deleted by ${component.user.tag}`);
                            settingsRow = await this.database.updateSettings({ ...partialSettingsRow, event_role_id: null });
                            break;
                        }
                        case DDDButtonID.CREATE_PASSING_ROLE: {
                            if (settingsRow.passing_role_id) break;
                            const role = await guild.roles.create({ name: 'Passing DDD', mentionable: true, reason: `Created by ${component.user.tag}`, color: 3342130 });
                            participantRows = await this.database.fetchAllParticipants(partialSettingsRow);
                            settingsRow = await this.database.updateSettings({ ...partialSettingsRow, passing_role_id: role.id });
                            for (const participantRow of participantRows) {
                                const member = guild.members.cache.get(participantRow.user_id);
                                if (member && !participantRow.failed) await member.roles.add(settingsRow.passing_role_id!);
                            }
                            break;
                        }
                        case DDDButtonID.DELETE_PASSING_ROLE: {
                            if (!settingsRow.passing_role_id) break;
                            const role = await guild.roles.fetch(settingsRow.passing_role_id);
                            if (role) await role.delete(`Deleted by ${component.user.tag}`);
                            settingsRow = await this.database.updateSettings({ ...partialSettingsRow, passing_role_id: null });
                            break;
                        }
                        case DDDButtonID.CREATE_FAILED_ROLE: {
                            if (settingsRow.failed_role_id) break;
                            const role = await guild.roles.create({ name: 'Failed DDD', mentionable: true, reason: `Created by ${component.user.tag}`, color: 16724530 });
                            participantRows = await this.database.fetchAllParticipants(partialSettingsRow);
                            settingsRow = await this.database.updateSettings({ ...partialSettingsRow, failed_role_id: role.id });
                            for (const participantRow of participantRows) {
                                const member = guild.members.cache.get(participantRow.user_id);
                                if (member && participantRow.failed) await member.roles.add(settingsRow.failed_role_id!);
                            }
                            break;
                        }
                        case DDDButtonID.DELETE_FAILED_ROLE: {
                            if (!settingsRow.failed_role_id) break;
                            const role = await guild.roles.fetch(settingsRow.failed_role_id);
                            if (role) await role.delete(`Deleted by ${component.user.tag}`);
                            settingsRow = await this.database.updateSettings({ ...partialSettingsRow, failed_role_id: null });
                            break;
                        }
                    }
                    participantRows = await this.database.fetchAllParticipants(partialSettingsRow);
                    const replyOptions = this.replies.createSettingsReply(command, eventDetails, settingsRow, participantRows);
                    return await component.editReply(replyOptions);
                }));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                return message;
            }
            case 'nut': {
                await command.deferReply({ ephemeral: true });
                const partialParticipant = { guild_id: member.guild.id, user_id: member.id, year: eventDetails.year };
                const participantRow = await this.database.fetchParticipant(partialParticipant);
                const participantZoneDetails = participantRow ? DDDUtil.getZoneDetails(eventDetails, participantRow.zone) : null;
                const allNutRows = await this.database.fetchAllNuts(partialParticipant);
                if (
                    (!participantZoneDetails || !participantZoneDetails.isDecember)       // It is not december or they have not joined
                ) { return command.followUp(this.replies.createNutFailReply(command, eventDetails, participantZoneDetails)); }
                const description = command.options.getString('description');
                allNutRows.push(await this.database.setNut({ ...partialParticipant, epoch: command.createdTimestamp.toString(), description: description }));
                const participantStats = DDDUtil.getParticipantStats(participantRow!, allNutRows)
                const replyOptions = this.replies.createNutReply(command, participantStats);
                return command.followUp(replyOptions);
            }
        }
    }

    public override async setup(client: HandlerClient): Promise<any> {
        await super.setup(client);
        await this.database.createTables();
        const eventDetails = DDDUtil.getEventDetails();
        const allParticipantRows = await this.database.fetchAllParticipants(eventDetails.year);
        for (const participantRows of allParticipantRows) this.createSchedule(client, participantRows);
    }
}
