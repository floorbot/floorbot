import { BuilderContext, ResponseOptions, ReplyBuilder } from '../../../lib/discord/builders/ReplyBuilder.js';
import { ButtonActionRowBuilder } from '../../../lib/discord/builders/ButtonActionRowBuilder.js';
import { DDDEventDetails, DDDParticipantStats, DDDZoneDetails } from './DDDUtil.js';
import { DDDNutRow, DDDParticipantRow, DDDSettingsRow } from './db/DDDDatabase.js';
import { ButtonBuilder } from '../../../lib/discord/builders/ButtonBuilder.js';
import { EmbedBuilder } from '../../../lib/discord/builders/EmbedBuilder.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';

export const DDDButtonID = {
    SET_EVENT_CHANNEL: 'set_event_channel',
    CLEAR_EVENT_CHANNEL: 'clear_event_channel',
    CREATE_EVENT_ROLE: 'create_event_role',
    DELETE_EVENT_ROLE: 'delete_event_role',
    CREATE_PASSING_ROLE: 'create_passing_role',
    DELETE_PASSING_ROLE: 'delete_passing_role',
    CREATE_FAILED_ROLE: 'create_failed_role',
    DELETE_FAILED_ROLE: 'delete_failed_role'
};

export class DDDReplyBuilder extends ReplyBuilder {

    private readonly eventAcronym: string;
    private readonly eventName: string;

    constructor(options: { eventName: string, eventAcronym: string; }, data?: BuilderContext | (ResponseOptions & { context?: BuilderContext; })) {
        super(data);
        this.eventAcronym = options.eventAcronym;
        this.eventName = options.eventName;
    }

    protected override createEmbedBuilder(eventDetails?: DDDEventDetails): EmbedBuilder {
        const embed = super.createEmbedBuilder()
            .setFooter({ text: `😩 ${this.eventName} ${eventDetails ? eventDetails.year : ''} 🍆` });
        return embed;
    }

    private getEventID(eventDetails: DDDEventDetails) {
        return `${this.eventAcronym} ${eventDetails.year}`;
    }

    private strikeout(condition: boolean | any, text: string): string {
        return condition ? `~~${text}~~` : text;
    }

    public addDDDParticipantFailedEmbed(settings: DDDSettingsRow, participantStats: DDDParticipantStats): this {
        const { eventDetails, participantRow, nutMonth, dayFailed, allNutRows } = participantStats;
        const eventID = this.getEventID(eventDetails);
        const embed = this.createEmbedBuilder(eventDetails)
            .setDescription([
                `<@${participantRow.user_id}> has failed ${eventID}!`,
                `Here are their stats for day ${dayFailed}`,
                '',
                `Total Nuts: **${allNutRows.length}**`,
                `Daily Nuts: **${nutMonth[dayFailed - 1]!.length}/${dayFailed}**`,
                `Failed: **${dayFailed ? `Day ${dayFailed}` : '*Not Yet!*'} **`,
            ]);
        this.addEmbed(embed);
        this.setContent(settings.event_role_id ? `<@&${settings.event_role_id}>` : 'Hey Everyone!');
        return this;
    }

    public addDDDParticipantPassedEmbed(settings: DDDSettingsRow, participantStats: DDDParticipantStats): this {
        const { day, eventDetails, participantRow, nutMonth, dayFailed, allNutRows } = participantStats;
        const eventID = this.getEventID(eventDetails);
        const embed = this.createEmbedBuilder(eventDetails)
            .setDescription([
                `<@${participantRow.user_id}> has passed ${eventID}!`,
                `Here are their stats for day ${day}`,
                '',
                `Total Nuts: **${allNutRows.length}/${(day) * (day + 1) / 2}**`,
                `Daily Nuts: **${nutMonth[day - 1]!.length}/${day}**`,
                `Failed: **${dayFailed ? `Day ${dayFailed}` : '*Never!*'} **`,
            ]);
        this.addEmbed(embed);
        this.setContent(settings.event_role_id ? `<@&${settings.event_role_id}>` : 'Hey Everyone!');
        return this;
    }

    public addDDDLeaderboardEmbed(eventDetails: DDDEventDetails, allParticipantStats: DDDParticipantStats[]): this {
        allParticipantStats = allParticipantStats.sort(function (one, two) {
            let sortNum = 0;
            const oneRequiredNuts = one.day;
            const oneNuts = one.nutMonth[one.day - 1]!.length;
            const oneCompleted = oneNuts / oneRequiredNuts;
            const twoRequiredNuts = two.day;
            const twoNuts = two.nutMonth[two.day - 1]!.length;
            const twoCompleted = twoNuts / twoRequiredNuts;
            sortNum += (two.participantRow.failed == 0 && one.participantRow.failed > 0) ? 100000 : 0;
            sortNum += (two.participantRow.failed > 0 && one.participantRow.failed == 0) ? -100000 : 0;
            sortNum += (two.participantRow.failed > one.participantRow.failed) ? 10000 : 0;
            sortNum += (one.participantRow.failed > two.participantRow.failed) ? -10000 : 0;
            sortNum += (twoCompleted >= 1 && oneCompleted < 1) ? 1000 : 0;
            sortNum += (twoCompleted < 1 && oneCompleted >= 1) ? -1000 : 0;
            sortNum += (twoNuts > oneNuts) ? 100 : 0;
            sortNum += (oneNuts > twoNuts) ? -100 : 0;
            sortNum += (two.allNutRows.length > one.allNutRows.length) ? 10 : 0;
            sortNum += (one.allNutRows.length > two.allNutRows.length) ? -10 : 0;
            return sortNum;
        });
        const stringRows = allParticipantStats.map(participantStats => {
            let day = participantStats.day;
            const userID = participantStats.participantRow.user_id;
            let dailyNuts = participantStats.nutMonth[day - 1]!.length;
            const nuts = participantStats.allNutRows.length;
            const failed = participantStats.participantRow.failed;
            let statusEmoji = '🟢';
            if (dailyNuts / day < 1) {
                statusEmoji = '🟡';
            }
            if (failed) {
                statusEmoji = '🔴';
                day = failed;
                dailyNuts = participantStats.nutMonth[day - 1]!.length;
            }
            return `${statusEmoji} Day: \`${day}\` Nuts: \`${dailyNuts}/${day}\` (\`${nuts}\` Total) <@${userID}>`;
        });
        const embed = this.createEmbedBuilder(eventDetails)
            .setTitle(`DDD Leaderboard for ${this.context!.guild!.name}`)
            .setDescription(stringRows.length ? stringRows : 'There are no participants to show...');
        return this.addEmbed(embed);
    }

    public addDDDNotTextChannelEmbed(eventDetails: DDDEventDetails): this {
        const embed = this.createEmbedBuilder(eventDetails)
            .setDescription(`Sorry! You can only view the control panel in TextChannels...`);
        this.addEmbed(embed);
        this.setEphemeral();
        return this;
    }

    public addDDDSettingsEmbed(eventDetails: DDDEventDetails, settings: DDDSettingsRow, participants: DDDParticipantRow[]): this {
        const eventID = this.getEventID(eventDetails);
        const embed = this.createEmbedBuilder(eventDetails)
            .setTitle(`DDD Settings for ${this.context!.guild!.name}`)
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
                ' - *The event role can be customized (e.g. rename, hoist, colour)*',
                ' - *The bot must have `Manage Permissions` to create and delete an event role*',
                ' - *Members in different timezones will see different \`start\` and \`stop\` times*',
                ' - *The event role and channel settings are **not required** for the event to function*',
                ' - *Anyone can join the event using the command and setting their timezone*'
            ]);
        this.addEmbed(embed);
        this.addDDDSettingsActionRow(settings);
        return this;
    }

    private addDDDSettingsActionRow(settings: DDDSettingsRow): this {
        const actionRow1 = new ButtonActionRowBuilder();
        actionRow1.addComponents(
            ...(!settings.channel_id ? [new ButtonBuilder().setLabel('Set Event Channel').setCustomId(DDDButtonID.SET_EVENT_CHANNEL)] : []),
            ...(settings.channel_id ? [new ButtonBuilder().setLabel('Clear Event Channel').setCustomId(DDDButtonID.CLEAR_EVENT_CHANNEL)] : []),
            ...(!settings.event_role_id ? [new ButtonBuilder().setLabel('Create Event Role').setCustomId(DDDButtonID.CREATE_EVENT_ROLE)] : []),
            ...(settings.event_role_id ? [new ButtonBuilder().setLabel('Delete Event Role').setCustomId(DDDButtonID.DELETE_EVENT_ROLE)] : [])
        );
        const actionRow2 = new ButtonActionRowBuilder();
        actionRow2.addComponents(
            ...(!settings.passing_role_id ? [new ButtonBuilder().setLabel('Create Passing Role').setCustomId(DDDButtonID.CREATE_PASSING_ROLE)] : []),
            ...(settings.passing_role_id ? [new ButtonBuilder().setLabel('Delete Passing Role').setCustomId(DDDButtonID.DELETE_PASSING_ROLE)] : []),
            ...(!settings.failed_role_id ? [new ButtonBuilder().setLabel('Create Failed Role').setCustomId(DDDButtonID.CREATE_FAILED_ROLE)] : []),
            ...(settings.failed_role_id ? [new ButtonBuilder().setLabel('Delete Failed Role').setCustomId(DDDButtonID.DELETE_FAILED_ROLE)] : [])
        );
        return this.addActionRows(actionRow1, actionRow2);
    }

    public addDDDJoinEmbed(eventDetails: DDDEventDetails, zoneDetails: DDDZoneDetails): this {
        const timeString = `<t:${Math.round(eventDetails.guaranteedDate.toSeconds())}:R>`;
        const eventID = this.getEventID(eventDetails);
        const embed = this.createEmbedBuilder(eventDetails)
            .setDescription([
                `${this.context!.member} Thanks for playing! Please check your date, time and timezone details below. If they are incorrect you can join again before the season starts!`,
                '',
                `**Zone:** \`${zoneDetails.now.zone.name}\` 🌏`,
                `**Time:** ${zoneDetails.now.toLocaleString({ day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })} (*Server Time*)`,
                `**UTC:** <t:${Math.round(zoneDetails.now.toSeconds())}:f> (*Device Time*)`,
                '',
                `Note: *\`Time\` and \`UTC\` (should) look the same if your timezone is set correctly and matches your device system time! Guaranteed joining of ${eventID} ends ${timeString}!*`
            ]);
        return this.addEmbed(embed);
    }

    public addDDDJoinFailEmbed(eventDetails: DDDEventDetails, zone: string, zoneDetails: DDDZoneDetails | null, participantZoneDetails: DDDZoneDetails | null, allNutRows: DDDNutRow[]): this {
        const eventID = this.getEventID(eventDetails);
        const embed = this.createEmbedBuilder(eventDetails)
            .setDescription([
                ...(participantZoneDetails ?
                    [`Sorry! It looks like I couldn't update your timezone details from \`${participantZoneDetails.zone}\` to \`${zone}\``] :
                    [`Sorry! It looks like I failed to set your timezone details to \`${zone}\``]),
                '',
                'This could be for the following reasons:',
                ` - *${this.strikeout(zoneDetails, `\`${zone}\` is not a valid timezone`)}*`,
                ` - *${this.strikeout(!zoneDetails, `${eventID} has already begun in the specified timezone ${zoneDetails ? `(cutoff <t:${Math.round(zoneDetails.cutoffDate.toSeconds())}:R>)` : ''}`)}*`,
                ` - *${this.strikeout(!participantZoneDetails, `${eventID} has already begun in your existing timezone ${participantZoneDetails ? `(cutoff <t:${Math.round(participantZoneDetails.cutoffDate.toSeconds())}:R>)` : ''}`)}*`,
                ` - *${this.strikeout(!allNutRows.length, `You have already reported a nut in your timezone`)}*`,
                '',
                '*If possible you can try joining again with a different timezone!*'
            ]);
        return this.addEmbed(embed);
    }

    public addDDDLeaveEmbed(eventDetails: DDDEventDetails): this {
        const eventID = this.getEventID(eventDetails);
        const embed = this.createEmbedBuilder(eventDetails)
            .setDescription(`I have removed you from ${eventID}. If you change your mind before december please consider joining again!`);
        this.addEmbed(embed);
        this.setEphemeral();
        return this;
    }

    public addLeaveFailEmbed(eventDetails: DDDEventDetails, participantZoneDetails: DDDZoneDetails | null, allNutRows: DDDNutRow[]): this {
        const eventID = this.getEventID(eventDetails);
        const embed = this.createEmbedBuilder(eventDetails)
            .setDescription([
                ...(participantZoneDetails ?
                    [`Sorry! It looks like I couldn't remove you from ${eventID} with timezone \`${participantZoneDetails.zone}\``] :
                    [`Sorry! It looks like I couldn't remove you from ${eventID}`]),
                '',
                'This could be for the following reasons:',
                ` - *${this.strikeout(participantZoneDetails, `You were not participating in ${eventID}`)}*`,
                ` - *${this.strikeout(!participantZoneDetails, `${eventID} has already begun in your timezone ${participantZoneDetails ? `(cutoff <t:${Math.round(participantZoneDetails.cutoffDate.toSeconds())}:R>)` : ''}`)}*`,
                ` - *${this.strikeout(!allNutRows.length, `You have already reported a nut in your timezone`)}*`
            ]);
        return this.addEmbed(embed);
    }

    public addDDDNutEmbed(participantStats: DDDParticipantStats): this {
        const { day, eventDetails, zoneDetails, nutMonth, dayFailed, allNutRows } = participantStats;
        const embed = this.createEmbedBuilder(eventDetails)
            .setDescription([
                'Thanks for nutting!',
                `Here are your stats for day ${day}`,
                '',
                `Total Nuts: **${allNutRows.length}/${(day) * (day + 1) / 2}**`,
                `Daily Nuts: **${nutMonth[day - 1]!.length}/${day}**`,
                `Failed: **${dayFailed ? `Day ${dayFailed}` : '*Not Yet!*'} **`,
                `Midnight: **<t:${zoneDetails.nextMidnight.toSeconds()}:R>**`
            ]);
        return this.addEmbed(embed);
    }

    public addDDDNutFailEmbed(eventDetails: DDDEventDetails, participantZoneDetails: DDDZoneDetails | null): this {
        const eventID = this.getEventID(eventDetails);
        const embed = this.createEmbedBuilder(eventDetails)
            .setAuthor(this.context!)
            .setDescription([
                ...(participantZoneDetails ?
                    [`Sorry! It looks like ${eventID} has not started in your timezone (\`${participantZoneDetails.zone}\`) yet! You can start reporting your nuts <t:${Math.round(participantZoneDetails.startDate.toSeconds())}:R>!`] :
                    [`Sorry! It looks like you have not joined ${eventID}. To guarantee participating please join before the cutoff <t:${Math.round(eventDetails.guaranteedDate.toSeconds())}:R>!`])
            ]);
        return this.addEmbed(embed);
    }
}
