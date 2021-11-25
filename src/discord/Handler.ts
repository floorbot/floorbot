import { ApplicationCommandData, BaseCommandInteraction, BitFieldResolvable, IntentsString } from 'discord.js';
import { Autocomplete } from './handlers/interfaces/Autocomplete.js';
import { HandlerClient } from './HandlerClient.js';

export interface HandlerOptions {

    readonly intents?: BitFieldResolvable<IntentsString, number>;
    readonly type: typeof BaseCommandInteraction,
    readonly data: ApplicationCommandData,
    readonly global?: boolean,
    readonly nsfw?: boolean,
    readonly group: string
}

export abstract class Handler<T extends BaseCommandInteraction> {

    public readonly intents: BitFieldResolvable<IntentsString, number>;
    public readonly type: typeof BaseCommandInteraction;
    public readonly data: ApplicationCommandData;
    public readonly global: boolean;
    public readonly nsfw: boolean;
    public readonly group: string;

    constructor(options: HandlerOptions) {
        this.intents = options.intents ?? [];
        this.global = options.global ?? false;
        this.nsfw = options.nsfw ?? false;
        this.group = options.group;
        this.type = options.type;
        this.data = options.data;
    }

    public abstract execute(interaction: T): Promise<any>;

    public async initialise(_client: HandlerClient): Promise<any> { return null; }
    public async finalise(_client: HandlerClient): Promise<any> { return null; }
    public async setup(_client: HandlerClient): Promise<any> { return null; }

    /** A type guard to check if this command supports (implements) autocomplete  */
    public hasAutocomplete(): this is Autocomplete { return 'autocomplete' in this }
}
