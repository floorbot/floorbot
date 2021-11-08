import { CommandInteraction, Guild, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { HandlerEmbed } from '../../../../discord/components/HandlerEmbed';
import { DDDMemberRow, DDDNutRow, DDDSettingsRow } from '../DDDDatabase';
import { DDDSeasonDetails, DDDUtil, DDDZoneDetails } from '../DDDUtil';
import { HandlerUtil } from '../../../../discord/handler/HandlerUtil';
import { DateTime } from 'luxon';

export class DDDEmbed extends HandlerEmbed {

    constructor(command: CommandInteraction, seasonDetails: DDDSeasonDetails, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(command);
        this.setFooter(`😩 Destroy Dick December ${seasonDetails.season} 🍆`);
    }

    public static createNotTextChannelEmbed(command: CommandInteraction, seasonDetails: DDDSeasonDetails): DDDEmbed {
        return new DDDEmbed(command, seasonDetails)
            .setDescription(`Sorry! You can only view the control panel in TextChannels...`);
    }

    public static createSettingsEmbed(command: CommandInteraction, seasonDetails: DDDSeasonDetails, settings: DDDSettingsRow, members: DDDMemberRow[]): DDDEmbed {
        const { guild } = <{ guild: Guild }>command;
        const now = DateTime.now();
        const year = now.month <= 12 ? now.year : now.year + 1;
        const starts = DateTime.fromObject({ year: year, month: 12, day: 1, hour: 0 });
        const stops = DateTime.fromObject({ year: year, month: 12, day: 31, hour: 24 });
        return new DDDEmbed(command, seasonDetails)
            .setTitle(`DDD Settings for ${guild.name}`)
            .setDescription([
                `**Event Channel:** ${settings.channel_id ? `<#${settings.channel_id}>` : '*none set*'} *(automated announcements)*`,
                `**Event Role:** ${settings.role_id ? `<@&${settings.role_id}>` : '*none set*'} *(group participants)*`,
                `**Participants:** ${HandlerUtil.formatCommas(members.length)}`,
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

    public static createJoinEmbed(command: CommandInteraction, zoneDetails: DDDZoneDetails, seasonDetails: DDDSeasonDetails): DDDEmbed {
        const timeString = `<t:${Math.round(seasonDetails.guaranteed_date.toSeconds())}:R>`;
        const now = zoneDetails.now;
        return new DDDEmbed(command, seasonDetails)
            .setDescription([
                `${command.user} Thanks for playing! Please check your date, time and timezone details below. If they are incorrect you can join again before the season starts!`,
                '',
                `**Zone:** \`${now.zone.name}\` 🌏`,
                `**Time:** ${now.toLocaleString({ day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })} (*Server Time*)`,
                `**UTC:** <t:${Math.round(zoneDetails.now.toSeconds())}:f> (*Device Time*)`,
                '',
                `Note: *\`Time\` and \`UTC\` (should) look the same if your timezone is set correctly and matches your device system time! Guaranteed joining of DDD ${seasonDetails.season} ends ${timeString}!*`
            ]);
    }

    public static createJoinFailEmbed(command: CommandInteraction, timezone: string, seasonDetails: DDDSeasonDetails, memberZoneDetail: DDDZoneDetails | null, zoneDetails: DDDZoneDetails | null, allNutRows: DDDNutRow[]): DDDEmbed {
        return new DDDEmbed(command, seasonDetails)
            .setDescription([
                ...(memberZoneDetail ?
                    [`Sorry! It looks like I couldn't update your timezone details from \`${memberZoneDetail.zone}\` to \`${timezone}\``] :
                    [`Sorry! It looks like I failed to set your timezone details to \`${timezone}\``]),
                '',
                'This could be for the folllowing reasons:',
                ...(!zoneDetails ? [` - *\`${timezone}\` is not a valid timezone*`] : []),
                ...(zoneDetails ? [` - *DDD has already begun in the Specified timezone (cutoff <t:${Math.round(zoneDetails.guaranteed_date.toSeconds())}:R>)*`] : []),
                ...(memberZoneDetail ? [` - *DDD has already begun in your existing timezone (cutoff <t:${Math.round(memberZoneDetail.guaranteed_date.toSeconds())}:R>)*`] : []),
                ...(allNutRows.length ? [` - *You have already reported a nut in your existing timezone*`] : []),
                '',
                '*If possible you can try \`/ddd join\` again with a different timezone*'
            ]);
    }

    public static createLeaveEmbed(command: CommandInteraction, zoneDetails: DDDZoneDetails, seasonDetails: DDDSeasonDetails): DDDEmbed {
        return new DDDEmbed(command, seasonDetails)
            .setDescription([
                `I have removed you from DDD ${seasonDetails.season}. If you change your mind before december you can always join again:`,
                `\`/ddd join timezone:${zoneDetails.zone}\``
            ]);
    }

    public static createLeaveFailEmbed(command: CommandInteraction, seasonDetails: DDDSeasonDetails, memberZoneDetail: DDDZoneDetails | null, allNutRows: DDDNutRow[]): DDDEmbed {
        return new DDDEmbed(command, seasonDetails)
            .setDescription([
                ...(memberZoneDetail ?
                    [`Sorry! It looks like I couldn't remove you from DDD ${seasonDetails.season} with timezone \`${memberZoneDetail.zone}\``] :
                    [`Sorry! It looks like I couldn't remove you from DDD ${seasonDetails.season}`]),
                '',
                'This could be for the folllowing reasons:',
                ...(!memberZoneDetail ? [` - *You were not participating in DDD ${seasonDetails.season}*`] : []),
                ...(memberZoneDetail ? [` - *DDD has already begun in your timezone (cutoff <t:${Math.round(memberZoneDetail.guaranteed_date.toSeconds())}:R>)*`] : []),
                ...(allNutRows.length ? [` - *You have already reported a nut in your timezone*`] : [])
            ]);
    }

    public static createNutEmbed(command: CommandInteraction, seasonDetails: DDDSeasonDetails, memberZoneDetail: DDDZoneDetails, allNutRows: DDDNutRow[]): DDDEmbed {
        const nutMonth = DDDUtil.getNutsMonth(memberZoneDetail, allNutRows);
        const dayFailed = nutMonth.findIndex((nutDay, index) => nutDay.length < index + 1) + 1;
        const day = memberZoneDetail.now.day;
        return new DDDEmbed(command, seasonDetails)
            .setDescription([
                'Thanks for nutting!',
                `Here are your stats for day ${day}`,
                '',
                `Total Nuts: **${allNutRows.length}/${(day) * (day + 1) / 2}**`,
                `Daily Nuts: **${nutMonth[day - 1]!.length}/${day}**`,
                `Failed: **${dayFailed && dayFailed < day ? `Day ${dayFailed}` : '*Not Yet!*'} **`,
                `Midnight: **<t:${Math.round(DDDUtil.getNextMidnight(memberZoneDetail.zone).toSeconds())}:R>**`
            ]);
    }

    public static createNutFailEmbed(command: CommandInteraction, seasonDetails: DDDSeasonDetails, memberZoneDetail: DDDZoneDetails | null): DDDEmbed {
        return new DDDEmbed(command, seasonDetails)
            .setDescription([
                ...(memberZoneDetail ?
                    [`Sorry! It looks like DDD ${seasonDetails.season} has not started in your timezone (\`${memberZoneDetail.zone}\`) yet! You can start reporting your nuts <t:${Math.round(memberZoneDetail.start_date.toSeconds())}:R>!`] :
                    [`Sorry! It looks like you have not joined DDD ${seasonDetails.season}. To guarantee participating please join before the cutoff <t:${Math.round(seasonDetails.guaranteed_date.toSeconds())}:R>!`])
            ]);
    }
}
