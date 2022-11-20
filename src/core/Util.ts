import { APIMessage, BaseInteraction, Client, CollectedInteraction, Message, PermissionsBitField } from 'discord.js';
import { HandlerClient } from 'discord.js-handlers';
import { DateTime } from 'luxon';
import { ComponentCollector, ComponentCollectorEndHandler, ComponentCollectorOptions } from './ComponentCollector.js';

export class Util {

    /**
     * Converts local string to emoji flag
     * @param countryCode The local string
     * @returns The local emoji
     */
    public static localeToEmoji(countryCode: string): string | null {
        if (!countryCode.codePointAt(0) || !countryCode.codePointAt(1)) return null;
        const firstLetter: string = String.fromCodePoint(countryCode.codePointAt(0)! - 0x41 + 0x1F1E6);
        const secondLetter: string = String.fromCodePoint(countryCode.codePointAt(1)! - 0x41 + 0x1F1E6);
        return `${firstLetter}${secondLetter}`;
    }

    /**
     * Converts a timezone string to current time string
     * @param timezone The timezone to get time for
     * @returns The current time string
     */
    public static formatTimezone(timezone: string): string {
        const date = DateTime.now().setZone(timezone);
        return date.toLocaleString({
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h12'
        });
    }

    /**
     * Creates a component collector with a standard time and end handler
     * @param message The message to collect component interactions from
     * @param options Collector options with overridable defaults
     * @returns The created ComponentCollector
     */
    public static createComponentCollector<T extends CollectedInteraction>(client: Client, message: APIMessage | Message, options?: Omit<ComponentCollectorOptions<T>, 'message'>): ComponentCollector<T> {
        options = { idle: 1000 * 60 * 15, endHandler: ComponentCollectorEndHandler.Delete, ...options };
        return new ComponentCollector(client, { message: message, ...options });
    }

    /**
     * Checks if the invoker of one interaction is the same as another, has administrator permissions or an environment set owner
     * @param target The interaction to check the invoker from
     * @param source An optional interaction for comparing invoking user
     * @returns Whether the invoker is considered an admin or owner depending on scope
     */
    public static isAdminOrOwner(target: BaseInteraction, source?: BaseInteraction): boolean {
        if (target.client instanceof HandlerClient && target.client.ownerIDs.includes(target.user.id)) return true;
        if (source && target.user.id === source.user.id) return true;
        if (target.inGuild()) {
            const member = target.member;
            const permissions = new PermissionsBitField();
            if (member.permissions instanceof PermissionsBitField) permissions.add(member.permissions);
            if (typeof member.permissions === 'string') permissions.add(BigInt(member.permissions));
            if (permissions.has(PermissionsBitField.Flags.Administrator)) return true;
        }
        return false;
    }

    /**
     * Formats a decimal number adding commas every thousands and rounding significance
     * @param number The number to format
     * @param significance The level of significance
     * @returns The stringified formatted decimal
     */
    public static formatNumber(number: number | string, { significance = null, commas = false }: { significance?: number | null, commas?: boolean; }): string {
        if (significance !== null) number = (Number(number) || 0).toFixed(significance).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1');
        if (commas) number = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return number.toString();
    }

    /**
     * Capitalise and format a string for most common use cases
     * @param string The string to capitalise
     * @returns The capitalised string
     */
    public static capitaliseString(string: string | boolean): string {
        return string.toString()
            .replace(/\_/g, ' ') // Replace "_" with " "
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Replace "CamelCase" with "Camel Case"
            .toLowerCase()
            .split(' ') // Split at " "
            .map(s => s.charAt(0).toUpperCase() + s.substring(1)) // Capitalize each word
            .join(' '); // Join the string back together
    }

    public static lowercaseString(string: string | boolean): string {
        return Util.capitaliseString(string).toLowerCase();
    }

    /**
     * Converts celsius to fahrenheit
     * @param degrees The celsius temp to convert
     * @returns The fahrenheit conversion
     */
    public static toFahrenheit(degrees: number): number {
        return Math.round((degrees) * 9 / 5 + 32);
    }

    /**
     * Splits a string into multiple chunks at a designated character that do not exceed a specific length.
     * @param text Content to split
     * @param options Options controlling the behavior of the split
     * @returns The message split into an array
     */
    public static splitMessage(text: string, { maxLength = 2000, char = '', prepend = '', append = '' } = {}) {
        console.log('UTIL SPLIT MESSAGE NEEDS TO BE REWRITTEN');
        if (text.length <= maxLength) return [text];
        const splitText = text.split(char);
        if (splitText.some(chunk => chunk.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
        const messages = [];
        let msg = '';
        for (const chunk of splitText) {
            if (msg && (msg + char + chunk + append).length > maxLength) {
                messages.push(msg + append);
                msg = prepend;
            }
            msg += (msg && msg !== prepend ? char : '') + chunk;
        }
        return messages.concat(msg).filter(m => m);
    }

    public static shortenText(text: string, { maxLength = 2000, append = '...', char = '' } = {}): string {
        if (text.length <= maxLength) return text;
        const substring = text.substring(0, maxLength - append.length);
        if (!char) return substring.trimEnd() + append;
        const splitSubstring = substring.split(char);
        const splitText = text.split(char);
        const last = splitSubstring.length - 1;
        if (splitSubstring[last] !== splitText[last]) splitSubstring.pop();
        return splitSubstring.join(char).trimEnd() + append;
    }
}
