import { ComponentCollector, ComponentCollectorEndHandler, ComponentCollectorOptions } from './ComponentCollector.js';
import { APIMessage, Client, CollectedInteraction, Interaction, Message, PermissionsBitField } from 'discord.js';
import { HandlerClient } from 'discord.js-handlers';

export class Util {

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
    public static isAdminOrOwner(target: Interaction, source?: Interaction): boolean {
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
    public static formatNumber(number: number | string, { significance = null, commas = false }): string {
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

    public static shortenMessage(message: string, options: SplitOptions = {}): string {
        const short = Util.splitMessage(message, { maxLength: 512, char: '', append: '...', ...options })[0];
        return short || '';
    }

    public static splitMessage(text: string, { maxLength = 2_000, char = '\n', prepend = '', append = '' }: SplitOptions = {}) {
        console.log('THE SPLIT MESSAGE FUNCTION NEEDS TO BE REWRITTEN');
        if (text.length <= maxLength) return [text];
        let splitText: (string | null)[] = [text];
        if (Array.isArray(char)) {
            while (char.length > 0 && splitText.some(elem => elem && elem.length > maxLength)) {
                const currentChar = char.shift();
                if (currentChar instanceof RegExp) {
                    splitText = splitText.flatMap(chunk => chunk && chunk.match(currentChar));
                } else {
                    splitText = splitText.flatMap(chunk => chunk && chunk.split(currentChar!));
                }
            }
        } else {
            splitText = text.split(char);
        }
        if (splitText.some(elem => elem && elem.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
        const messages = [];
        let msg = '';
        for (const chunk of splitText) {
            if (msg && (msg + char + chunk + append).length > maxLength) {
                messages.push(msg + append);
                msg = prepend;
            }
            msg += (msg && msg !== prepend ? char : '') + chunk!;
        }
        return messages.concat(msg).filter(m => m);
    }
}

export type SplitOptions = { maxLength?: number, char?: string | string[] | RegExp | RegExp[], prepend?: string, append?: string; };
