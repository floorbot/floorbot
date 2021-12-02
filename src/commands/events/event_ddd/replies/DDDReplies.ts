import { CommandInteraction, Constants, Interaction, InteractionReplyOptions, Message, MessageActionRow } from 'discord.js';
import { HandlerButton, HandlerButtonID } from '../../../../discord/helpers/components/HandlerButton.js';
import { HandlerEmbed } from '../../../../discord/helpers/components/HandlerEmbed.js';
import { DDDEventDetails, DDDParticipantStats, DDDZoneDetails } from '../DDDUtil.js';
import { DDDNutRow, DDDParticipantRow, DDDSettingsRow } from '../db/DDDDatabase.js';
import { HandlerReplies } from '../../../../discord/helpers/HandlerReplies.js';
import { HandlerUtil } from '../../../../discord/HandlerUtil.js';

const { MessageButtonStyles } = Constants;

export const DDDButtonID = {
    ...HandlerButtonID, ...{
        SET_EVENT_CHANNEL: 'set_event_channel',
        CLEAR_EVENT_CHANNEL: 'clear_event_channel',
        CREATE_EVENT_ROLE: 'create_event_role',
        DELETE_EVENT_ROLE: 'delete_event_role',
        CREATE_PASSING_ROLE: 'create_passing_role',
        DELETE_PASSING_ROLE: 'delete_passing_role',
        CREATE_FAILED_ROLE: 'create_failed_role',
        DELETE_FAILED_ROLE: 'delete_failed_role'
    }
}

export class DDDReplies extends HandlerReplies {

    private readonly eventAcronym: string;
    private readonly eventName: string;

    constructor(options: { eventName: string, eventAcronym: string }) {
        super();
        this.eventAcronym = options.eventAcronym;
        this.eventName = options.eventName;
    }

    private getEventID(eventDetails: DDDEventDetails) {
        return `${this.eventAcronym} ${eventDetails.year}`;
    }

    private strikeout(condition: boolean | any, text: string): string {
        return condition ? `~~${text}~~` : text;
    }

    public override createEmbedTemplate(context?: Interaction | Message, eventDetails?: DDDEventDetails): HandlerEmbed {
        return super.createEmbedTemplate(context)
            .setFooter(`😩 ${this.eventName} ${eventDetails ? eventDetails.year : ''} 🍆`);
    }

    public override createButtonTemplate(): HandlerButton {
        return super.createButtonTemplate()
            .setStyle(MessageButtonStyles.PRIMARY);
    }

    public createParticipantFailedReply(settings: DDDSettingsRow, participantStats: DDDParticipantStats): InteractionReplyOptions {
        const { day, eventDetails, participantRow, nutMonth, dayFailed, allNutRows } = participantStats;
        const eventID = this.getEventID(eventDetails);
        return this.createEmbedTemplate(undefined, eventDetails)
            .setDescription([
                `<@${participantRow.user_id}> has failed ${eventID}!`,
                `Here are their stats for day ${day}`,
                '',
                `Total Nuts: **${allNutRows.length}/${(day) * (day + 1) / 2}**`,
                `Daily Nuts: **${nutMonth[day - 1]!.length}/${day}**`,
                `Failed: **${dayFailed ? `Day ${dayFailed}` : '*Not Yet!*'} **`,
            ])
            .toReplyOptions({ content: settings.event_role_id ? `<@&${settings.event_role_id}>` : 'Hey Everyone!' });
    }

    public createParticipantPassedReply(settings: DDDSettingsRow, participantStats: DDDParticipantStats): InteractionReplyOptions {
        const { day, eventDetails, participantRow, nutMonth, dayFailed, allNutRows } = participantStats;
        const eventID = this.getEventID(eventDetails);
        return this.createEmbedTemplate(undefined, eventDetails)
            .setDescription([
                `<@${participantRow.user_id}> has passed ${eventID}!`,
                `Here are their stats for day ${day}`,
                '',
                `Total Nuts: **${allNutRows.length}/${(day) * (day + 1) / 2}**`,
                `Daily Nuts: **${nutMonth[day - 1]!.length}/${day}**`,
                `Failed: **${dayFailed ? `Day ${dayFailed}` : '*Never!*'} **`,
            ])
            .toReplyOptions({ content: settings.event_role_id ? `<@&${settings.event_role_id}>` : 'Hey Everyone!' });
    }

    public createLeaderboardReply(command: CommandInteraction<'cached'>, eventDetails: DDDEventDetails, allParticipantStats: DDDParticipantStats[]): InteractionReplyOptions {
        allParticipantStats = allParticipantStats.sort(function(one, two) {
            let sortNum = 0
            const oneRequiredNuts = (one.day) * (one.day + 1) / 2;
            const oneNuts = one.allNutRows.length;
            const oneCompleted = oneNuts / oneRequiredNuts;
            const twoRequiredNuts = (two.day) * (two.day + 1) / 2;
            const twoNuts = two.allNutRows.length;
            const twoCompleted = twoNuts / twoRequiredNuts;
            if (two.participantRow.failed == 0 && one.participantRow.failed > 0) {
                sortNum += 1000;
            }
            if (two.participantRow.failed > 0 && one.participantRow.failed == 0) {
                sortNum += -1000;
            }
            if (twoCompleted >= 1 && oneCompleted < 1) {
                sortNum += 100;
            }
            if (twoCompleted < 1 && oneCompleted >= 1) {
                sortNum += -100;
            }
            if (two.allNutRows.length > one.allNutRows.length) {
              sortNum += 10
            }
            if (one.allNutRows.length > two.allNutRows.length) {
              sortNum += -10
            }
            return sortNum;
        });
        const stringRows = allParticipantStats.map(participantStats => {
            let day = participantStats.day;
            const userID = participantStats.participantRow.user_id;
            const nuts = participantStats.allNutRows.length;
            const failed = participantStats.participantRow.failed;
            const requiredNuts = (day) * (day + 1) / 2;
            let statusEmoji = '🟢'
            if (nuts / requiredNuts < 1) {
                statusEmoji = '🟡'
            }
            if (failed) {
                statusEmoji = '🔴'
                day = failed;
            }
            // return `${statusEmoji} Day: \`${day}\` Nuts: \`${nuts}/${requiredNuts}\` <@${userID}>`
            return `${statusEmoji} Day: \`${day}\` Nuts: \`${nuts}/${requiredNuts}\` <@${userID}>`
        });
        return this.createEmbedTemplate(command, eventDetails)
            .setTitle(`DDD Leaderboard for ${command.guild.name}`)
            .setDescription(stringRows.length ? stringRows : 'There are no participants to show...')
            .toReplyOptions()
    }

    public createNotTextChannelReply(command: CommandInteraction, eventDetails: DDDEventDetails): InteractionReplyOptions {
        return this.createEmbedTemplate(command, eventDetails)
            .setDescription(`Sorry! You can only view the control panel in TextChannels...`)
            .toReplyOptions({ ephemeral: true });
    }

    public createSettingsReply(command: CommandInteraction<'cached'>, eventDetails: DDDEventDetails, settings: DDDSettingsRow, participants: DDDParticipantRow[]): InteractionReplyOptions {
        const eventID = this.getEventID(eventDetails);
        const embed = this.createEmbedTemplate(command, eventDetails)
            .setTitle(`DDD Settings for ${command.guild.name}`)
            .setDescription([
                `**Event Channel:** ${settings.channel_id ? `<#${settings.channel_id}>` : '*none set*'} *(announcements)*`,
                `**Event Role:** ${settings.event_role_id ? `<@&${settings.event_role_id}>` : '*none set*'} *(all participants)*`,
                `**Passing Role:** ${settings.passing_role_id ? `<@&${settings.passing_role_id}>` : '*none set*'} *(passing participants)*`,
                `**Failed Role:** ${settings.failed_role_id ? `<@&${settings.failed_role_id}>` : '*none set*'} *(failed participants)*`,
                `**Participants:** ${HandlerUtil.formatCommas(participants.length)}`,
                '',
                `**Time until ${eventID}:**`,
                `**Starts:** (${eventDetails.startDate.zone.name}) <t:${Math.round(eventDetails.startDate.toSeconds())}:R>`,
                `**Stops:** (${eventDetails.stopDate.zone.name}) <t:${Math.round(eventDetails.stopDate.toSeconds())}:R>`,
                '',
                '__Please Note__:',
                ' - *The event role can be customised (e.g. rename, hoist, colour)*',
                ' - *The bot must have `Manage Permissions` to create and delete an event role*',
                ' - *Members in different timezones will see different \`start\` and \`stop\` times*',
                ' - *The event role and channel settings are **not required** for the event to function*',
                ' - *Anyone can join the event using the command and setting their timezone*'
            ]);

        const actionRow1 = new MessageActionRow().addComponents([
            ...(!settings.channel_id ? [this.createButtonTemplate().setLabel('Set Event Channel').setCustomId(DDDButtonID.SET_EVENT_CHANNEL)] : []),
            ...(settings.channel_id ? [this.createButtonTemplate().setLabel('Clear Event Channel').setCustomId(DDDButtonID.CLEAR_EVENT_CHANNEL)] : []),
            ...(!settings.event_role_id ? [this.createButtonTemplate().setLabel('Create Event Role').setCustomId(DDDButtonID.CREATE_EVENT_ROLE)] : []),
            ...(settings.event_role_id ? [this.createButtonTemplate().setLabel('Delete Event Role').setCustomId(DDDButtonID.DELETE_EVENT_ROLE)] : [])
        ]);
        const actionRow2 = new MessageActionRow().addComponents([
            ...(!settings.passing_role_id ? [this.createButtonTemplate().setLabel('Create Passing Role').setCustomId(DDDButtonID.CREATE_PASSING_ROLE)] : []),
            ...(settings.passing_role_id ? [this.createButtonTemplate().setLabel('Delete Passing Role').setCustomId(DDDButtonID.DELETE_PASSING_ROLE)] : []),
            ...(!settings.failed_role_id ? [this.createButtonTemplate().setLabel('Create Failed Role').setCustomId(DDDButtonID.CREATE_FAILED_ROLE)] : []),
            ...(settings.failed_role_id ? [this.createButtonTemplate().setLabel('Delete Failed Role').setCustomId(DDDButtonID.DELETE_FAILED_ROLE)] : [])
        ]);

        return { embeds: [embed], components: [actionRow1, actionRow2] };
    }

    public createJoinReply(command: CommandInteraction, eventDetails: DDDEventDetails, zoneDetails: DDDZoneDetails): InteractionReplyOptions {
        const timeString = `<t:${Math.round(eventDetails.guaranteedDate.toSeconds())}:R>`;
        const eventID = this.getEventID(eventDetails);
        return this.createEmbedTemplate(command, eventDetails)
            .setDescription([
                `${command.user} Thanks for playing! Please check your date, time and timezone details below. If they are incorrect you can join again before the season starts!`,
                '',
                `**Zone:** \`${zoneDetails.now.zone.name}\` 🌏`,
                `**Time:** ${zoneDetails.now.toLocaleString({ day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })} (*Server Time*)`,
                `**UTC:** <t:${Math.round(zoneDetails.now.toSeconds())}:f> (*Device Time*)`,
                '',
                `Note: *\`Time\` and \`UTC\` (should) look the same if your timezone is set correctly and matches your device system time! Guaranteed joining of ${eventID} ends ${timeString}!*`
            ])
            .toReplyOptions();
    }

    public createJoinFailReply(command: CommandInteraction, eventDetails: DDDEventDetails, zone: string, zoneDetails: DDDZoneDetails | null, participantZoneDetails: DDDZoneDetails | null, allNutRows: DDDNutRow[]): InteractionReplyOptions {
        const eventID = this.getEventID(eventDetails);
        return this.createEmbedTemplate(command, eventDetails)
            .setDescription([
                ...(participantZoneDetails ?
                    [`Sorry! It looks like I couldn't update your timezone details from \`${participantZoneDetails.zone}\` to \`${zone}\``] :
                    [`Sorry! It looks like I failed to set your timezone details to \`${zone}\``]),
                '',
                'This could be for the folllowing reasons:',
                ` - *${this.strikeout(zoneDetails, `\`${zone}\` is not a valid timezone`)}*`,
                ` - *${this.strikeout(!zoneDetails, `${eventID} has already begun in the specified timezone ${zoneDetails ? `(cutoff <t:${Math.round(zoneDetails.cutoffDate.toSeconds())}:R>)` : ''}`)}*`,
                ` - *${this.strikeout(!participantZoneDetails, `${eventID} has already begun in your existing timezone ${participantZoneDetails ? `(cutoff <t:${Math.round(participantZoneDetails.cutoffDate.toSeconds())}:R>)` : ''}`)}*`,
                ` - *${this.strikeout(!allNutRows.length, `You have already reported a nut in your timezone`)}*`,
                '',
                '*If possible you can try joining again with a different timezone!*'
            ])
            .toReplyOptions();
    }

    public createLeaveReply(command: CommandInteraction, eventDetails: DDDEventDetails): InteractionReplyOptions {
        const eventID = this.getEventID(eventDetails);
        return this.createEmbedTemplate(command, eventDetails)
            .setDescription(`I have removed you from ${eventID}. If you change your mind before december please consider joining again!`)
            .toReplyOptions({ ephemeral: true });
    }

    public createLeaveFailReply(command: CommandInteraction, eventDetails: DDDEventDetails, participantZoneDetails: DDDZoneDetails | null, allNutRows: DDDNutRow[]): InteractionReplyOptions {
        const eventID = this.getEventID(eventDetails);
        return this.createEmbedTemplate(command, eventDetails)
            .setDescription([
                ...(participantZoneDetails ?
                    [`Sorry! It looks like I couldn't remove you from ${eventID} with timezone \`${participantZoneDetails.zone}\``] :
                    [`Sorry! It looks like I couldn't remove you from ${eventID}`]),
                '',
                'This could be for the folllowing reasons:',
                ` - *${this.strikeout(participantZoneDetails, `You were not participating in ${eventID}`)}*`,
                ` - *${this.strikeout(!participantZoneDetails, `${eventID} has already begun in your timezone ${participantZoneDetails ? `(cutoff <t:${Math.round(participantZoneDetails.cutoffDate.toSeconds())}:R>)` : ''}`)}*`,
                ` - *${this.strikeout(!allNutRows.length, `You have already reported a nut in your timezone`)}*`
            ])
            .toReplyOptions();
    }

    public createNutReply(command: CommandInteraction, participantStats: DDDParticipantStats): InteractionReplyOptions {
        const { day, eventDetails, zoneDetails, nutMonth, dayFailed, allNutRows } = participantStats;
        return this.createEmbedTemplate(command, eventDetails)
            .setDescription([
                'Thanks for nutting!',
                `Here are your stats for day ${day}`,
                '',
                `Total Nuts: **${allNutRows.length}/${(day) * (day + 1) / 2}**`,
                `Daily Nuts: **${nutMonth[day - 1]!.length}/${day}**`,
                `Failed: **${dayFailed ? `Day ${dayFailed}` : '*Not Yet!*'} **`,
                `Midnight: **<t:${zoneDetails.nextMidnight.toSeconds()}:R>**`
            ])
            .toReplyOptions()
    }

    public createNutFailReply(command: CommandInteraction, eventDetails: DDDEventDetails, participantZoneDetails: DDDZoneDetails | null): InteractionReplyOptions {
        const eventID = this.getEventID(eventDetails);
        return this.createEmbedTemplate(command, eventDetails)
            .setContextAuthor(command)
            .setDescription([
                ...(participantZoneDetails ?
                    [`Sorry! It looks like ${eventID} has not started in your timezone (\`${participantZoneDetails.zone}\`) yet! You can start reporting your nuts <t:${Math.round(participantZoneDetails.startDate.toSeconds())}:R>!`] :
                    [`Sorry! It looks like you have not joined ${eventID}. To guarantee participating please join before the cutoff <t:${Math.round(eventDetails.guaranteedDate.toSeconds())}:R>!`])
            ])
            .toReplyOptions()
    }
}
