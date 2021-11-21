import { ChatInputHandler, ChatInputHandlerOptions } from '../../discord/handler/abstracts/ChatInputHandler.js';
import { Autocomplete } from '../../discord/handler/interfaces/Autocomplete.js';
import { AutocompleteInteraction } from 'discord.js';
import tzdata from 'tzdata';

export interface EventHandlerOptions extends Omit<ChatInputHandlerOptions, 'group'> {
    readonly eventName: string,
}

export abstract class EventHandler extends ChatInputHandler implements Autocomplete {

    private static readonly ZONES = Object.keys(tzdata.zones);
    readonly eventName: string; // temp public for ts
    // private readonly abbr: string;

    constructor(options: EventHandlerOptions) {
        super({ group: 'Event', global: false, nsfw: false, ...options });
        // this.abbr = options.name.match(/[A-Z]/g).join('');
        this.eventName = options.eventName;
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partial = interaction.options.getString('zone', true).toLowerCase();
        const suggestions = EventHandler.ZONES.filter(zone => zone.toLowerCase().includes(partial));
        const options = suggestions.slice(0, 25).map(suggestion => ({ name: suggestion, value: suggestion }));
        return interaction.respond(options);
    }
}
