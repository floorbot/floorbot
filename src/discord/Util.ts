import { CommandInteraction, ContextMenuInteraction, BaseCommandInteraction, ButtonInteraction, SelectMenuInteraction, MessageComponentInteraction, Interaction, Permissions, InteractionReplyOptions } from 'discord.js'
import { Util, Collection, User, Guild, GuildMember, TextChannel, DMChannel, Role, Message, GuildChannel, Channel, Client } from 'discord.js';
import * as twemoji from 'twemoji';

export type HandlerContext = Interaction | Message;

declare module 'discord.js' {
    export namespace Util {
        export function deleteComponentsOnEnd(message: Message): () => void;
        export function isAdminOrOwner(member: GuildMember, interaction?: Interaction): boolean;
        export function toggleMessageComponents(message: Message, disabled: boolean): void;
        export function toFahrenheit(degrees: number): number;
        export function resolveEmoji(string: string): { string: string, imageURL: string } | null;
        export function resolveRole(context: HandlerContext, string: string): Role | null;
        export function resolveUser(context: HandlerContext, string: string, allowBot?: boolean): User | null;
        export function resolveMember(context: HandlerContext, string: string, allowBot?: boolean): GuildMember | null;
        export function resolveContextName(context: HandlerContext): string;
        export function localeToEmoji(countryCode: string): string | null;
        export function getRandomUser(channel: TextChannel, bot?: boolean): GuildMember;
        export function getRandomRole(guild: Guild): Role;
        export function propTotal<T>(objects: Array<T>, property: string): number;
        export function propAverage<T>(objects: Array<T>, property: string): number;
        export function arrayFrequency(array: Array<any>): object;
        export function arrayMode(array: Array<any>): object;
        export function capitalizeString(string: string): string;
        export function formatString(string: string, fill: Array<string>): string;
        export function formatDecimal(number: number, significance?: number): string;
        export function formatCommas(number: number): string;
        export function formatDate(date: Date | number, options?: FormatDateOptions): string;
    }
}

Util.deleteComponentsOnEnd = function(message: Message) {
    return async () => {
        try {
            message = await message.fetch();
            const replyOptions: InteractionReplyOptions = {
                ...(message.content && { content: message.content }),
                embeds: message.embeds,
                components: [],
                attachments: [...message.attachments.values()]
            };
            await message.edit(replyOptions);
        } catch { }
    }
}

Util.isAdminOrOwner = function(member: GuildMember, interaction?: Interaction): boolean {
    if (!member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return false;
    if (interaction) return member.user === interaction.user;
    return true;
}

Util.toggleMessageComponents = function(message: Message, disabled: boolean): void {
    for (const actionRow of message.components) {
        for (const component of actionRow.components) {
            component.setDisabled(disabled);
        }
    }
}

Util.toFahrenheit = function(degrees: number): number {
    return Math.round((degrees) * 9 / 5 + 32);
}

Util.resolveEmoji = function(string: string): { string: string, imageURL: string } | null {
    const png = /<:[^:]+:(\d+)>/g.exec(string);
    if (png) return { string: string, imageURL: `https://cdn.discordapp.com/emojis/${png[1]}.png` };
    const gif = /<a:[^:]+:(\d+)>/g.exec(string);
    if (gif) return { string: string, imageURL: `https://cdn.discordapp.com/emojis/${gif[1]}.gif` };
    const svg = twemoji.parse(string, { folder: 'svg', ext: '.svg' }).match(/(http(s?):)([^\s])*\.svg/);
    if (svg) return { string: string, imageURL: svg[0]! };
    return null;
}

Util.resolveRole = function(context: HandlerContext, string: string): Role | null {
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

Util.resolveUser = function(context: HandlerContext, string: string, allowBot: boolean = false): User | null {
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
    const member = Util.resolveMember(context, string, allowBot);
    return member ? member.user : null;
}

Util.resolveMember = function(context: HandlerContext, string: string, allowBot: boolean = false): GuildMember | null {
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

Util.resolveContextName = function(context: HandlerContext): string {
    switch (true) {
        case context instanceof CommandInteraction: return 'slash command';
        case context instanceof ContextMenuInteraction: return 'context menu';
        case context instanceof BaseCommandInteraction: return 'command';
        case context instanceof ButtonInteraction: return 'button';
        case context instanceof SelectMenuInteraction: return 'select menu';
        case context instanceof MessageComponentInteraction: return 'component';
        case context instanceof Interaction: return 'interaction';
        case context instanceof Message: return 'regex';
        default: throw context;
    }
}

Util.localeToEmoji = function(countryCode: string): string | null {
    if (!countryCode.codePointAt(0) || !countryCode.codePointAt(1)) return null;
    const firstLetter: string = String.fromCodePoint(countryCode.codePointAt(0)! - 0x41 + 0x1F1E6);
    const secondLetter: string = String.fromCodePoint(countryCode.codePointAt(1)! - 0x41 + 0x1F1E6);
    return `${firstLetter}${secondLetter}`
}

Util.getRandomUser = function(channel: TextChannel, bot: boolean = false): GuildMember {
    const members: Collection<string, GuildMember> = channel.members.filter((member: GuildMember) => { return bot || member.user.bot });
    return members.random()!;
}

Util.getRandomRole = function(guild: Guild): Role {
    return guild.roles.cache.random()!;
}

Util.propTotal = function(objects: Array<any>, property: string): number {
    return objects.reduce((total: number, object: any) => total + object[property], 0);
}

Util.propAverage = function <T>(objects: Array<T>, property: string): number {
    return Util.propTotal<T>(objects, property) / (objects.length || 1);
}

Util.arrayFrequency = function(array: Array<any>): object {
    return array.reduce((frequencies: any, current: any) => {
        return ((frequencies[current] = ++frequencies[current] || 1), frequencies)
    }, {});
}

Util.arrayMode = function(array: Array<any>): object {
    return array.sort((a, b) => array.filter(v => v === a).length - array.filter(v => v === b).length).pop();
}

Util.capitalizeString = function(string: string): string {
    return string.toLowerCase().replace(/\_/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
}

Util.formatString = function(string: string, fill: Array<string>): string {
    return string.replace(/{(\d+)}/g, (match, number: number) => {
        return typeof fill[number] !== 'undefined' ? fill[number]! : match;
    });
}

Util.formatDecimal = function(number: number, significance: number = 1): string {
    return (Number(number) || 0).toFixed(significance).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1');
}

Util.formatCommas = function(number: number): string {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

Util.formatDate = function(date: Date | number, options: FormatDateOptions = {}): string {
    date = date instanceof Date ? date : new Date(date);
    options = Object.assign({
        showTime: false,
        showDate: true,
        fullName: true
    }, options);

    const months = options.fullName ? ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateText = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    const amAMpmPM = date.getHours() >= 12 ?
        (options.fullName ? ' PM' : 'pm') :
        (options.fullName ? ' AM' : 'am')
    const timeText = `${(date.getHours() % 12) < 10 ? '0' : ''}${date.getHours() % 12 || '12'}:${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}${amAMpmPM}`;
    if (options.showDate && options.showTime) return `${dateText} at ${timeText}`;
    return options.showDate ? dateText : timeText;
}

export interface FormatDateOptions {
    showTime?: boolean; // Shows clock
    showDate?: boolean; // Shows date
    fullName?: boolean; // The full month name
}
