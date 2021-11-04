import { Guild, Interaction, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { DDDMemberSchema, DDDNutSchema, DDDSettingsSchema } from './DDDDatabase';
import { HandlerEmbed } from '../../../components/HandlerEmbed';
import { HandlerContext } from '../../../discord/Util';
import { DateTime } from 'luxon';

export class DDDEmbed extends HandlerEmbed {

    constructor(context: HandlerContext, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(context);
    }

    public static createNutEmbed(context: HandlerContext, memberRow: DDDMemberSchema, allNutRows: DDDNutSchema[]): DDDEmbed {
        return new DDDEmbed(context)
            .setDescription([
                `<@${memberRow.user_id}> Thanks for nutting \`${allNutRows.length}\` times!`,
                'I\'m sorry but thats all I can do for now'
            ])
    }

    public static createSettingsEmbed(context: Interaction, settings: DDDSettingsSchema, members: DDDMemberSchema[]): DDDEmbed {
        const { guild } = <{ guild: Guild }>context;
        const now = DateTime.now();
        const year = now.month <= 12 ? now.year : now.year + 1;
        const starts = DateTime.fromObject({ year: year, month: 12, day: 1, hour: 0 });
        const stops = DateTime.fromObject({ year: year, month: 12, day: 31, hour: 24 });
        return new DDDEmbed(context)
            .setTitle(`DDD Settings for ${guild.name}`)
            .setDescription([
                `**Channel:** ${settings.channel_id ? `<#${settings.channel_id}>` : '*none set*'}`,
                `**Role:** ${settings.role_id ? `<@&${settings.role_id}>` : '*none set*'}`,
                `**Members:** ${members.length}`,
                '',
                `**Time until ${year} DDD:**`,
                `**Starts:** <t:${Math.round(starts.toSeconds())}:R>`,
                `**Stops:** <t:${Math.round(stops.toSeconds())}:R>`
            ])
    }

    public static createConfirmRegisterEmbed(context: Interaction, date: DateTime): DDDEmbed {
        return new DDDEmbed(context)
            .setDescription([
                `${context.user} Thanks for playing! Please check your date, time and timezone details below. If they are incorrect you can register again!`,
                '',
                `**Zone:** \`${date.zone.name}\` 🌏`,
                `**Time:** ${date.toLocaleString({ day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h24' })} (*Server Time*)`,
                `**UTC:** <t:${Math.round(date.toSeconds())}:f> (*Device Time*)`,
                '',
                'Note: *\`Time\` and \`UTC\` (should) look the same the timezone is set correctly and matches your device system time!*'
            ])
    }

    public static createUnknownTimezoneEmbed(context: HandlerContext, timezone: string): DDDEmbed {
        return new DDDEmbed(context)
            .setDescription([
                `Sorry! It looks like \`${timezone}\` is not a valid timezone 😦`,
                '*Please use the autocomplete to search for your timezone or visit this [timezone picker](https://kevinnovak.github.io/Time-Zone-Picker/) to find yours!*'
            ])
    }

    public static createNoTimezoneEmbed(context: HandlerContext, allNutRows: DDDNutSchema[]): DDDEmbed {
        return new DDDEmbed(context)
            .setDescription([
                `Thanks for nutting ${allNutRows.length} times!`,
                `However you are not officially participating until you set a timezone`,
                `Please use \`/ddd register\` and see how you compare!`,
            ])
    }
}
