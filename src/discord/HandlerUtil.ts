import { Channel, Client, Collection, DMChannel, Constants, Guild, GuildChannel, GuildMember, Interaction, InteractionReplyOptions, Message, MessageComponentInteraction, Permissions, Role, TextChannel, User } from 'discord.js';
import { HandlerReplies } from './helpers/HandlerReplies.js';
import { HandlerClient } from './HandlerClient.js';
import twemoji from 'twemoji';

const { Events } = Constants;

export class HandlerUtil {

    public static isAdminOrOwner(member: GuildMember, interaction?: Interaction): boolean {
        if (member.client instanceof HandlerClient && member.client.ownerIds.includes(member.id)) return true;
        if (member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return true;
        if (interaction) return member.user === interaction.user;
        return false;
    }

    public static handleCollectorErrors(listener: (interaction: MessageComponentInteraction<any>) => Promise<any>): (interaction: MessageComponentInteraction) => Promise<void> {
        return (interaction: MessageComponentInteraction) => listener(interaction).catch(async error => {
            console.error(`[client] Collector has run into an error...`, error);
            const replyOptions = HandlerReplies.createUnexpectedErrorReply(interaction, error);
            await interaction.followUp(replyOptions)
        }).catch(error => console.error(`[client] Collector failed to report error...`, error));;
    }

    public static deleteComponentsOnEnd(message: Message): (collected: Collection<string, MessageComponentInteraction>, reason: string) => Promise<void> {
        return async (_collected, reason) => {
            try {
                switch (reason) {
                    case Events.MESSAGE_DELETE:
                    case Events.MESSAGE_BULK_DELETE:
                    case Events.CHANNEL_DELETE:
                    case Events.GUILD_DELETE: { return; }
                    case 'idle':
                    case 'time':
                    default: {
                        message = await message.fetch();
                        if (message.deleted) return;
                        const replyOptions: InteractionReplyOptions = {
                            ...(message.content && { content: message.content }),
                            embeds: message.embeds,
                            components: [],
                            attachments: [...message.attachments.values()]
                        };
                        await message.edit(replyOptions);
                    }
                }
            } catch (error) {
                console.warn('[util] Error deleting components from collector', error)
            }
        }
    }

    public static toggleMessageComponents(message: Message, disabled: boolean): void {
        for (const actionRow of message.components) {
            for (const component of actionRow.components) {
                component.setDisabled(disabled);
            }
        }
    }

    public static formatDecimal(number: number, significance: number = 1): string {
        return (Number(number) || 0).toFixed(significance).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1');
    }

    public static formatCommas(number: number): string {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    public static capitalizeString(string: string): string {
        return string.toLowerCase().replace(/\_/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
    }

    public static toFahrenheit(degrees: number): number {
        return Math.round((degrees) * 9 / 5 + 32);
    }

    public static resolveEmoji(string: string): { string: string, imageURL: string } | null {
        const png = /<:[^:]+:(\d+)>/g.exec(string);
        if (png) return { string: string, imageURL: `https://cdn.discordapp.com/emojis/${png[1]}.png` };
        const gif = /<a:[^:]+:(\d+)>/g.exec(string);
        if (gif) return { string: string, imageURL: `https://cdn.discordapp.com/emojis/${gif[1]}.gif` };
        const svg = twemoji.parse(string, { folder: 'svg', ext: '.svg' }).match(/(http(s?):)([^\s])*\.svg/);
        if (svg) return { string: string, imageURL: svg[0]! };
        return null;
    }

    public static resolveRole(context: Interaction | Message, string: string): Role | null {
        string = string.toLowerCase();
        const { channel } = context;
        if (channel instanceof TextChannel) {
            const { guild } = channel;
            return guild.roles.cache.find((role: Role) => {
                const testName: boolean = role.name.toLowerCase().includes(string);
                const testMention: boolean = role.toString().includes(string);
                return testName || testMention;
            }) || null;
        }
        return null;
    }

    public static resolveUser(context: Interaction | Message, string: string, allowBot: boolean = false): User | null {
        string = string.toLowerCase();
        const user = context instanceof Message ? context.author : context.user;
        const { guild, channel, client } = <{
            guild: Guild | undefined,
            channel: Channel,
            client: Client,
        }>context;
        if (string === 'me') return user;
        if (!guild && channel instanceof DMChannel) {
            if (channel.recipient.tag.toLowerCase().includes(string)) return user;
            if (allowBot && client.user && client.user.tag.toLowerCase().includes(string)) return client.user;
            return null;
        }
        const member = HandlerUtil.resolveMember(context, string, allowBot);
        return member ? member.user : null;
    }

    public static resolveMember(context: Interaction | Message, string: string, allowBot: boolean = false): GuildMember | null {
        string = string.toLowerCase();
        const { channel, member } = <{ channel: GuildChannel, member: GuildMember }>context;
        if (channel instanceof GuildChannel) {
            if (string === 'me' && (allowBot || (member && !member.user.bot))) return member;
            return channel.members.find((member: GuildMember) => {
                if (!allowBot && member.user.bot) return false;
                const testMention: boolean = member.toString() === string;
                const testUsername: boolean = member.user.tag.toLowerCase().includes(string);
                const testDisplayName: boolean = member.displayName.toLowerCase().includes(string);
                return testMention || testUsername || testDisplayName;
            }) || null;
        }
        return null;
    }

    public static localeToEmoji(countryCode: string): string | null {
        if (!countryCode.codePointAt(0) || !countryCode.codePointAt(1)) return null;
        const firstLetter: string = String.fromCodePoint(countryCode.codePointAt(0)! - 0x41 + 0x1F1E6);
        const secondLetter: string = String.fromCodePoint(countryCode.codePointAt(1)! - 0x41 + 0x1F1E6);
        return `${firstLetter}${secondLetter}`
    }
}
