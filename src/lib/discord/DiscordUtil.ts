import { Channel, Client, Interaction, Message, MessageComponentInteraction, PermissionsBitField, SplitOptions, User, Util } from 'discord.js';
import { ComponentCollector, ComponentCollectorEndHandler, ComponentCollectorOptions } from './ComponentCollector.js';
import { HandlerClient } from 'discord.js-handlers';
import { APIMessage } from 'discord-api-types/v10';

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

    /**
     * Checks if the invoker of one interaction is the same an another, has administrator permissions or an environment set owner
     * @param target The interaction to check the invoker from
     * @param source An optional interaction for comparing invoking user
     * @returns Whether the invoker is considered an admin or owner depending on scope
     */
    public static isAdminOrOwner(target: Interaction, source?: Interaction): boolean {

        // Check for environment set owner
        if (target.client instanceof HandlerClient && target.client.ownerIDs.includes(target.user.id)) return true;

        // Check for interaction source owner
        if (source && target.user.id === source.user.id) return true;

        // Check for administrator permissions
        const permissions = new PermissionsBitField();
        if (target.inGuild()) {
            const member = target.member;
            if (member.permissions instanceof PermissionsBitField) permissions.add(member.permissions);
            if (typeof member.permissions === 'string') permissions.add(BigInt(member.permissions));
            if (permissions.has(PermissionsBitField.Flags.Administrator)) return true;
        }

        return false;
    }

    public static isOwner(user: User): boolean {
        return user.client instanceof HandlerClient && user.client.ownerIDs.includes(user.id);
    }

    public static isNSFW(channel: Channel): boolean {
        if (channel.isDM()) return false;
        if (channel.isThread()) return !channel.parent || !channel.parent.nsfw;
        if (channel.isText()) return channel.nsfw;
        console.warn(`[support](nsfw) Unknown channel type <${channel.type}> for checking NSFW support`);
        return false;
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
        return string.toLowerCase()
            .replace(/\_/g, ' ') // Replace "_" with " "
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Replace "CamelCase" with "Camel Case"
            .split(' ') // Split at " "
            .map(s => s.charAt(0).toUpperCase() + s.substring(1)) // Capitalize each word
            .join(' '); // Join the string back together
    }
}
