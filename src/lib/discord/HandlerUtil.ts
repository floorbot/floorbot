import { Channel, Client, Collection, DMChannel, Guild, GuildChannel, GuildMember, Interaction, Message, MessageComponentInteraction, Role, TextChannel, User, Util, SplitOptions, PermissionFlagsBits, Events, ApplicationCommandData, CommandInteraction } from 'discord.js';
import { ApplicationCommandHandler, HandlerClient } from 'discord.js-handlers';
import { ResponseOptions, ReplyBuilder } from './builders/ReplyBuilder.js';
import probe, { ProbeResult } from 'probe-image-size';
import twemoji from 'twemoji';

export type NonEmptyArray<T> = [T, ...T[]];

export class HandlerUtil {

    public static isNSFW(channel: Channel): boolean {
        if (channel.isDM()) return false;
        if (channel.isThread()) return !channel.parent || !channel.parent.nsfw;
        if (channel.isText()) return channel.nsfw;
        console.warn(`[support](nsfw) Unknown channel type <${channel.type}> for checking NSFW support`);
        return false;
    }

    public static shortenMessage(message: string, options: SplitOptions = {}): string {
        const short = Util.splitMessage(message, { maxLength: 512, char: '', append: '...', ...options })[0];
        if (!short) throw new Error('[HandlerUtil] Failed to shorten message');
        return short;
    }

    public static isNonEmptyArray<T>(array: T[]): array is NonEmptyArray<T> {
        return array.length > 0;
    }

    public static resolvePage(page: number, pages: number): number {
        page = page % pages;
        page = page >= 0 ? page : pages + page;
        return page;
    }

    public static resolveArrayPage<T>(array: NonEmptyArray<T>, page: number): T {
        page = HandlerUtil.resolvePage(page, array.length);
        const value = array[page];
        if (!value) throw new Error('[HandlerUtil] Failed to resolve array page');
        return value;
    }

    public static isAdminOrOwner(member: GuildMember, interaction?: Interaction): boolean {
        if (member.client instanceof HandlerClient && member.client.ownerIDs.includes(member.id)) return true;
        if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
        if (interaction) return member.user === interaction.user;
        return false;
    }

    public static handleErrors(handler: ApplicationCommandHandler<CommandInteraction, ApplicationCommandData>): (error: any) => any {
        return (error: any) => {
            console.log(`[${handler.commandData.name}] Handler has encountered an unknown error`, error);
        };
    }

    public static handleCollectorErrors(listener: (interaction: MessageComponentInteraction<any>) => Promise<any>): (interaction: MessageComponentInteraction) => Promise<void> {
        return (interaction: MessageComponentInteraction) => listener(interaction).catch(async error => {
            console.error(`[client] Collector has run into an error...`, error);
            const replyOptions = new ReplyBuilder().addUnexpectedErrorEmbed(error);
            await interaction.followUp(replyOptions);
        }).catch(error => console.error(`[client] Collector failed to report error...`, error));
    }

    public static deleteComponentsOnEnd(message: Message): (collected: Collection<string, MessageComponentInteraction>, reason: string) => Promise<void> {
        return async (_collected, reason) => {
            try {
                switch (reason) {
                    case Events.MessageDelete:
                    case Events.MessageBulkDelete:
                    case Events.ChannelDelete:
                    case Events.GuildDelete: { return; }
                    case 'idle':
                    case 'time':
                    default: {
                        message = await message.fetch();
                        const replyOptions: ResponseOptions = {
                            ...(message.content && { content: message.content }),
                            embeds: message.embeds,
                            components: [],
                            attachments: [...message.attachments.values()]
                        };
                        await message.edit(replyOptions);
                    }
                }
            } catch (error) {
                console.warn('[util] Error deleting components from collector', error);
            }
        };
    }

    /**
     * @deprecated The method should not be used
     */
    public static toggleMessageComponents(message: Message, disabled: boolean): void {
        for (const actionRow of message.components) {
            for (const component of actionRow.components) {
                (<any>component).disabled = disabled; // workaround
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

    public static resolveEmoji(string: string): { string: string, imageURL: string; } | null {
        const png = /<:[^:]+:(\d+)>/g.exec(string);
        if (png) return { string: string, imageURL: `https://cdn.discordapp.com/emojis/${png[1]}.png` };
        const gif = /<a:[^:]+:(\d+)>/g.exec(string);
        if (gif) return { string: string, imageURL: `https://cdn.discordapp.com/emojis/${gif[1]}.gif` };
        // @ts-ignore
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
        if (!guild && channel instanceof DMChannel && channel.recipient) {
            if (channel.recipient.tag.toLowerCase().includes(string)) return user;
            if (allowBot && client.user && client.user.tag.toLowerCase().includes(string)) return client.user;
            return null;
        }
        const member = HandlerUtil.resolveMember(context, string, allowBot);
        return member ? member.user : null;
    }

    public static resolveMember(context: Interaction | Message, string: string, allowBot: boolean = false): GuildMember | null {
        string = string.toLowerCase();
        const { channel, member } = <{ channel: GuildChannel, member: GuildMember; }>context;
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
        return `${firstLetter}${secondLetter}`;
    }

    public static async probeMessage(message: Message): Promise<ProbeResult | null> {

        let metadata: ProbeResult | null = null;

        // Check all embeds for valid images
        for (const embed of message.embeds) {
            if (embed.thumbnail && embed.thumbnail.url) metadata = await probe(embed.thumbnail.url).catch(() => null) || metadata;
            if (embed.image && embed.image.url) metadata = await probe(embed.image.url).catch(() => null) || metadata;
        }

        // Check all attachments for valid images
        for (const attachment of message.attachments.values()) {
            metadata = await probe(attachment.url).catch(() => null) || metadata;
        }

        return metadata || null;
    }
}
