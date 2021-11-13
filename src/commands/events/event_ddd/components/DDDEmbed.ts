import { CommandInteraction, Guild, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { DDDEventDetails, DDDParticipantStats, DDDZoneDetails } from '../DDDUtil.js';
import { DDDNutRow, DDDParticipantRow, DDDSettingsRow } from '../DDDDatabase.js';
import { HandlerEmbed } from '../../../../discord/components/HandlerEmbed.js';
import { HandlerUtil } from '../../../../discord/handler/HandlerUtil.js';
import { DateTime } from 'luxon';

export class DDDEmbed extends HandlerEmbed {

    constructor(eventDetails: DDDEventDetails, command?: CommandInteraction, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setFooter(`😩 Destroy Dick December ${eventDetails.year} 🍆`);
        if (command) this.setContextAuthor(command);
    }

    public static createParticipantFailedEmbed(participantStats: DDDParticipantStats): DDDEmbed {
        const { day, eventDetails, participantRow, nutMonth, dayFailed, allNutRows } = participantStats;
        return new DDDEmbed(eventDetails)
            .setDescription([
                `<@${participantRow.user_id}> has failed DDD!`,
                `Here are their stats for day ${day}`,
                '',
                `Total Nuts: **${allNutRows.length}/${(day) * (day + 1) / 2}**`,
                `Daily Nuts: **${nutMonth[day - 1]!.length}/${day}**`,
                `Failed: **${dayFailed ? `Day ${dayFailed}` : '*Not Yet!*'} **`,
            ]);
    }

    public static createParticipantPassedEmbed(participantStats: DDDParticipantStats): DDDEmbed {
        const { day, eventDetails, participantRow, nutMonth, dayFailed, allNutRows } = participantStats;
        return new DDDEmbed(eventDetails)
            .setDescription([
                `<@${participantRow.user_id}> has passed DDD!`,
                `Here are their stats for day ${day}`,
                '',
                `Total Nuts: **${allNutRows.length}/${(day) * (day + 1) / 2}**`,
                `Daily Nuts: **${nutMonth[day - 1]!.length}/${day}**`,
                `Failed: **${dayFailed ? `Day ${dayFailed}` : '*Never!*'} **`,
            ]);
    }

    public static createNotTextChannelEmbed(command: CommandInteraction, eventDetails: DDDEventDetails): DDDEmbed {
        return new DDDEmbed(eventDetails, command)
            .setDescription(`Sorry! You can only view the control panel in TextChannels...`);
    }

    public static createSettingsEmbed(command: CommandInteraction, eventDetails: DDDEventDetails, settings: DDDSettingsRow, participants: DDDParticipantRow[]): DDDEmbed {
        const { guild } = <{ guild: Guild }>command;
        const now = DateTime.now();
        const year = now.month <= 12 ? now.year : now.year + 1;
        const starts = DateTime.fromObject({ year: year, month: 12, day: 1, hour: 0 });
        const stops = DateTime.fromObject({ year: year, month: 12, day: 31, hour: 24 });
        return new DDDEmbed(eventDetails, command)
            .setTitle(`DDD Settings for ${guild.name}`)
            .setDescription([
                `**Event Channel:** ${settings.channel_id ? `<#${settings.channel_id}>` : '*none set*'} *(announcements)*`,
                `**Event Role:** ${settings.event_role_id ? `<@&${settings.event_role_id}>` : '*none set*'} *(all participants)*`,
                `**Passing Role:** ${settings.passing_role_id ? `<@&${settings.passing_role_id}>` : '*none set*'} *(passing participants)*`,
                `**Failed Role:** ${settings.failed_role_id ? `<@&${settings.failed_role_id}>` : '*none set*'} *(failed participants)*`,
                `**Participants:** ${HandlerUtil.formatCommas(participants.length)}`,
                '',
                `**Time until ${year} DDD:**`,
                `**Starts:** <t:${Math.round(starts.toSeconds())}:R>`,
                `**Stops:** <t:${Math.round(stops.toSeconds())}:R>`,
                '',
                '__Please Note__:',
                ' - *The event role can be customised (e.g. rename, hoist, colour)*',
                ' - *The bot must have `Manage Permissions` to create and delete an event role*',
                ' - *Members in different timezones will see different \`start\` and \`stop\` times*',
                ' - *The event role and channel settings are **not required** for the event to function*',
                ' - *Anyone can join the event using \`/ddd join\` and setting their timezone*'
            ]);
    }

    public static createJoinEmbed(command: CommandInteraction, eventDetails: DDDEventDetails, zoneDetails: DDDZoneDetails): DDDEmbed {
        const timeString = `<t:${Math.round(eventDetails.guaranteedDate.toSeconds())}:R>`;
        return new DDDEmbed(eventDetails, command)
            .setDescription([
                `${command.user} Thanks for playing! Please check your date, time and timezone details below. If they are incorrect you can join again before the season starts!`,
                '',
                `**Zone:** \`${zoneDetails.now.zone.name}\` 🌏`,
                `**Time:** ${zoneDetails.now.toLocaleString({ day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })} (*Server Time*)`,
                `**UTC:** <t:${Math.round(zoneDetails.now.toSeconds())}:f> (*Device Time*)`,
                '',
                `Note: *\`Time\` and \`UTC\` (should) look the same if your timezone is set correctly and matches your device system time! Guaranteed joining of DDD ${eventDetails.year} ends ${timeString}!*`
            ]);
    }

    public static createJoinFailEmbed(command: CommandInteraction, eventDetails: DDDEventDetails, zone: string, zoneDetails: DDDZoneDetails | null, memberZoneDetail: DDDZoneDetails | null, allNutRows: DDDNutRow[]): DDDEmbed {
        return new DDDEmbed(eventDetails, command)
            .setDescription([
                ...(memberZoneDetail ?
                    [`Sorry! It looks like I couldn't update your timezone details from \`${memberZoneDetail.zone}\` to \`${zone}\``] :
                    [`Sorry! It looks like I failed to set your timezone details to \`${zone}\``]),
                '',
                'This could be for the folllowing reasons:',
                ...(!zoneDetails ? [` - *\`${zone}\` is not a valid timezone*`] : []),
                ...(zoneDetails ? [` - *DDD has already begun in the specified timezone (cutoff <t:${Math.round(zoneDetails.cutoffDate.toSeconds())}:R>)*`] : []),
                ...(memberZoneDetail ? [` - *DDD has already begun in your existing timezone (cutoff <t:${Math.round(memberZoneDetail.cutoffDate.toSeconds())}:R>)*`] : []),
                ...(allNutRows.length ? [` - *You have already reported a nut in your existing timezone*`] : []),
                '',
                '*If possible you can try \`/ddd join\` again with a different timezone*'
            ]);
    }

    public static createLeaveEmbed(command: CommandInteraction, eventDetails: DDDEventDetails, zoneDetails: DDDZoneDetails): DDDEmbed {
        return new DDDEmbed(eventDetails, command)
            .setDescription([
                `I have removed you from DDD ${eventDetails.year}. If you change your mind before december you can always join again:`,
                `\`/ddd join timezone:${zoneDetails.zone}\``
            ]);
    }

    public static createLeaveFailEmbed(command: CommandInteraction, eventDetails: DDDEventDetails, memberZoneDetail: DDDZoneDetails | null, allNutRows: DDDNutRow[]): DDDEmbed {
        return new DDDEmbed(eventDetails, command)
            .setDescription([
                ...(memberZoneDetail ?
                    [`Sorry! It looks like I couldn't remove you from DDD ${eventDetails.year} with timezone \`${memberZoneDetail.zone}\``] :
                    [`Sorry! It looks like I couldn't remove you from DDD ${eventDetails.year}`]),
                '',
                'This could be for the folllowing reasons:',
                ...(!memberZoneDetail ? [` - *You were not participating in DDD ${eventDetails.year}*`] : []),
                ...(memberZoneDetail ? [` - *DDD has already begun in your timezone (cutoff <t:${Math.round(memberZoneDetail.cutoffDate.toSeconds())}:R>)*`] : []),
                ...(allNutRows.length ? [` - *You have already reported a nut in your timezone*`] : [])
            ]);
    }

    public static createNutEmbed(command: CommandInteraction, participantStats: DDDParticipantStats): DDDEmbed {
        const { day, eventDetails, zoneDetails, nutMonth, dayFailed, allNutRows } = participantStats;
        return new DDDEmbed(eventDetails, command)
            .setDescription([
                'Thanks for nutting!',
                `Here are your stats for day ${day}`,
                '',
                `Total Nuts: **${allNutRows.length}/${(day) * (day + 1) / 2}**`,
                `Daily Nuts: **${nutMonth[day - 1]!.length}/${day}**`,
                `Failed: **${dayFailed ? `Day ${dayFailed}` : '*Not Yet!*'} **`,
                `Midnight: **<t:${zoneDetails.nextMidnight.toSeconds()}:R>**`
            ]);
    }

    public static createNutFailEmbed(command: CommandInteraction, eventDetails: DDDEventDetails, memberZoneDetail: DDDZoneDetails | null): DDDEmbed {
        return new DDDEmbed(eventDetails, command)
            .setDescription([
                ...(memberZoneDetail ?
                    [`Sorry! It looks like DDD ${eventDetails.year} has not started in your timezone (\`${memberZoneDetail.zone}\`) yet! You can start reporting your nuts <t:${Math.round(memberZoneDetail.startDate.toSeconds())}:R>!`] :
                    [`Sorry! It looks like you have not joined DDD ${eventDetails.year}. To guarantee participating please join before the cutoff <t:${Math.round(eventDetails.guaranteedDate.toSeconds())}:R>!`])
            ]);
    }
}
