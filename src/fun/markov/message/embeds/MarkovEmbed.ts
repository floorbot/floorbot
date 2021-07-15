import { MessageEmbed, GuildMember, Message, InteractionReplyOptions, GuildChannel, User } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class MarkovEmbed extends MessageEmbed {

    constructor(context: HandlerContext) {
        super();
        const { member } = (<{ member: GuildMember }>context);
        const displayName = member.displayName;
        const user = context instanceof Message ? context.author : context.user;
        this.setAuthor(displayName, user.displayAvatarURL());
        this.setColor(member.displayColor || 14840969);
    }

    public static getMissingAdminEmbed(context: HandlerContext): MarkovEmbed {
        return new MarkovEmbed(context)
            .setDescription(`Sorry! you must be an admin to use the markov control panel!`);
    }

    public static getWipeConfirmEmbed(context: HandlerContext, channel: GuildChannel): MarkovEmbed {
        return new MarkovEmbed(context)
            .setDescription([
                `⚠️ Are you sure you want to wipe all saved message data for ${channel}?`,
                `*Please note this is permanent and cannot be undone*`,
            ].join('\n'));
    }

    public static getPurgeConfirmEmbed(context: HandlerContext): MarkovEmbed {
        return new MarkovEmbed(context)
            .setDescription([
                '⚠️ Before you can disable markov all saved data must be purged',
                '⛔ This is irreversible and will hard reset all markov settings for this guild'
            ].join('\n'))
    }

    public static getPurgedEmbed(context: HandlerContext): MarkovEmbed {
        return new MarkovEmbed(context)
            .setDescription(`🦺 You can now safely disable markov!`);
    }

    public static getFailedEmbed(context: HandlerContext, channel: GuildChannel, user: User | null): MarkovEmbed {
        return new MarkovEmbed(context)
            .setDescription([
                `Sorry! I failed to genereate a message for ${channel}${user ? `/${user}` : ''}`,
                '',
                'This could be for the folllowing reasons:',
                ` - *Not enough saved history for this ${channel}${user ? `/${user}` : ''}*`,
                ' - *An unexpected error occured during generation*',
                ' - *Unlucky*',
                '',
                '*Please continue to use this channel as normal and try again later*'
            ].join('\n'))
    }

    public toReplyOptions(ephemeral: boolean = false): InteractionReplyOptions {
        return { embeds: [this], components: [], ephemeral: ephemeral };
    }
}
