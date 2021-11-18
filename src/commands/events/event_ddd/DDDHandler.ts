import { Client, Collection, CommandInteraction, MessageActionRow, MessageComponentInteraction, TextChannel } from 'discord.js';
import { DDDDatabase, DDDParticipantRow, DDDSettingsRow } from './DDDDatabase.js';
import { HandlerClient } from '../../../discord/handler/HandlerClient.js';
import { HandlerUtil } from '../../../discord/handler/HandlerUtil.js';
import { DDDButton, DDDButtonID } from './components/DDDButton.js';
import { DDDEventDetails, DDDUtil } from './DDDUtil.js';
import { DDDCommandData } from './DDDCommandData.js';
import { DDDEmbed } from './components/DDDEmbed.js';
import { EventHandler } from '../EventHandler.js';
import Schedule from 'node-schedule';
import { Pool } from 'mariadb';
import { HandlerReplies } from '../../../helpers/HandlerReplies.js';

export class DDDHandler extends EventHandler {

    private readonly jobs: Map<string, Schedule.Job> = new Collection();
    private readonly database: DDDDatabase;

    constructor(pool: Pool) {
        super({ eventName: 'Destroy Dick December', pool: pool, data: DDDCommandData });
        this.database = new DDDDatabase(pool);
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
                    const content = settingsRow.event_role_id ? `<@&${settingsRow.event_role_id}>` : 'Hey Everyone!';
                    const replyOptions = DDDEmbed.createParticipantPassedEmbed(participantStats).toReplyOptions({ content: content });
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
                        const content = settingsRow.event_role_id ? `<@&${settingsRow.event_role_id}>` : 'Hey Everyone!';
                        const replyOptions = DDDEmbed.createParticipantFailedEmbed(participantStats).toReplyOptions({ content: content });
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
                ) { return command.followUp(DDDEmbed.createJoinFailEmbed(command, eventDetails, zone, participantZoneDetails, zoneDetails, allNutRows).toReplyOptions()); }
                participantRow = await this.database.setParticipant({ ...partialParticipant, zone: zone, failed: 0 });
                this.createSchedule(client, participantRow); // TODO
                const settingsRow = await this.database.fetchSettings(partialParticipant);
                if (settingsRow.event_role_id) await member.roles.add(settingsRow.event_role_id).catch(() => { });
                if (settingsRow.passing_role_id) await member.roles.add(settingsRow.passing_role_id).catch(() => { });
                const replyOptions = DDDEmbed.createJoinEmbed(command, eventDetails, zoneDetails).toReplyOptions();
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
                ) { return command.followUp(DDDEmbed.createLeaveFailEmbed(command, eventDetails, participantZoneDetails, allNutRows).toReplyOptions()); }
                await this.database.deleteParticipant(partialParticipant);
                this.deleteSchedule(participantRow!);
                const settingsRow = await this.database.fetchSettings(partialParticipant);
                if (settingsRow.event_role_id) await member.roles.remove(settingsRow.event_role_id).catch(() => { });
                if (settingsRow.passing_role_id) await member.roles.remove(settingsRow.passing_role_id).catch(() => { });
                const replyOptions = DDDEmbed.createLeaveEmbed(command, eventDetails, participantZoneDetails).toReplyOptions({ ephemeral: true });
                return command.followUp(replyOptions);
            }
            case 'settings': {
                if (!(channel instanceof TextChannel)) return command.reply(DDDEmbed.createNotTextChannelEmbed(command, eventDetails).toReplyOptions({ ephemeral: true }));
                await command.deferReply();
                const partialSettingsRow = { guild_id: guild.id, year: eventDetails.year };
                let settingsRow = await this.database.fetchSettings(partialSettingsRow);
                let participantRows = await this.database.fetchAllParticipants(partialSettingsRow);
                const replyOptions = this.createControlPanelReplyOptions(command, eventDetails, settingsRow, participantRows);
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
                    const replyOptions = this.createControlPanelReplyOptions(command, eventDetails, settingsRow, participantRows);
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
                ) { return command.followUp(DDDEmbed.createNutFailEmbed(command, eventDetails, participantZoneDetails).toReplyOptions()); }
                const description = command.options.getString('description');
                allNutRows.push(await this.database.setNut({ ...partialParticipant, epoch: command.createdTimestamp.toString(), description: description }));
                const participantStats = DDDUtil.getParticipantStats(participantRow!, allNutRows)
                const replyOptions = DDDEmbed.createNutEmbed(command, participantStats).toReplyOptions();
                return command.followUp(replyOptions);
            }
        }
    }

    public createControlPanelReplyOptions(command: CommandInteraction, eventDetails: DDDEventDetails, settingsRow: DDDSettingsRow, participantRows: DDDParticipantRow[]) {
        const embed = DDDEmbed.createSettingsEmbed(command, eventDetails, settingsRow, participantRows);
        const actionRow = new MessageActionRow().addComponents([
            ...(!settingsRow.channel_id ? [DDDButton.createSetChannelButton()] : []),
            ...(settingsRow.channel_id ? [DDDButton.createClearChannelButton()] : []),
            ...(!settingsRow.event_role_id ? [DDDButton.createCreateEventRoleButton()] : []),
            ...(settingsRow.event_role_id ? [DDDButton.createDeleteEventRoleButton()] : [])
        ]);
        const actionRow2 = new MessageActionRow().addComponents([
            ...(!settingsRow.passing_role_id ? [DDDButton.createCreatePassingRoleButton()] : []),
            ...(settingsRow.passing_role_id ? [DDDButton.createDeletePassingRoleButton()] : []),
            ...(!settingsRow.failed_role_id ? [DDDButton.createCreateFailedRoleButton()] : []),
            ...(settingsRow.failed_role_id ? [DDDButton.createDeleteFailedRoleButton()] : [])
        ])
        return { embeds: [embed], components: [actionRow, actionRow2] };
    }

    public override async setup(client: HandlerClient): Promise<any> {
        await super.setup(client);
        await this.database.createTables();
        const eventDetails = DDDUtil.getEventDetails();
        const allParticipantRows = await this.database.fetchAllParticipants(eventDetails.year);
        for (const participantRows of allParticipantRows) this.createSchedule(client, participantRows);
    }
}
