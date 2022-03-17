import { ComponentCollector, ComponentCollectorEndHandler, ComponentCollectorOptions } from './ComponentCollector.js';
import { Client, Message, MessageComponentInteraction, SplitOptions, Util } from 'discord.js';
import { APIMessage } from 'discord-api-types/v9';

export class DiscordUtil {

    /**
     * Creates a component collector with standard time and end handler
     * @param message The message to collect component interactions from
     * @param options Collector options with overridable defaults
     * @returns The created ComponentCollector
     */
    public static createComponentCollector<T extends MessageComponentInteraction>(client: Client, message: APIMessage | Message, options?: Omit<ComponentCollectorOptions<T>, 'message'>): ComponentCollector<T> {
        options = { idle: 1000 * 60 * 15, endHandler: ComponentCollectorEndHandler.Delete, ...options };
        return new ComponentCollector(client, { message: message, ...options });
    }

    public static shortenMessage(message: string, options: SplitOptions = {}): string {
        const short = Util.splitMessage(message, { maxLength: 512, char: '', append: '...', ...options })[0];
        return short || '';
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
}
