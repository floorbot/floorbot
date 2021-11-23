import { ApplicationCommandData, BaseCommandInteraction, BitFieldResolvable, IntentsString } from 'discord.js';
import { Autocomplete } from './handlers/interfaces/Autocomplete.js';
import { HandlerClient } from './HandlerClient.js';

export interface HandlerOptions {
    /** The discord intents (resolvable) required for this command */
    readonly intents?: BitFieldResolvable<IntentsString, number>;

    /** The Interaction type this handler handles  */
    readonly type: typeof BaseCommandInteraction,

    /** The data sent to discord when posting this handler  */
    readonly data: ApplicationCommandData,

    /** Whether this command is globally enabled in all guilds [default: false]  */
    readonly global?: boolean,

    /** Whether this command is only allowed in NSFW channels [default: false]  */
    readonly nsfw?: boolean,

    /** An arbitrary group name used to group handlers by features  */
    readonly group: string
}

/** Represents a handler for discord commands */
export abstract class Handler<T extends BaseCommandInteraction> {

    /** The discord intents (resolvable) required for this command */
    public readonly intents: BitFieldResolvable<IntentsString, number>;

    /** The Interaction type this handler handles  */
    public readonly type: typeof BaseCommandInteraction;

    /** The data sent to discord when posting this handler  */
    public readonly data: ApplicationCommandData;

    /** Whether this command is globally enabled in all guilds [default: false]  */
    public readonly global: boolean;

    /** Whether this command is only allowed in NSFW channels [default: false]  */
    public readonly nsfw: boolean;

    /** An arbitrary group name used to group handlers by features  */
    public readonly group: string;

    constructor(options: HandlerOptions) {
        this.intents = options.intents ?? [];
        this.global = options.global ?? false;
        this.nsfw = options.nsfw ?? false;
        this.group = options.group;
        this.type = options.type;
        this.data = options.data;
    }

    /**
     * The main function run whenever a user uses this command. This is where all the command logic should be...
     * @param interaction The interaction representing the users command request
     */
    public abstract execute(interaction: T): Promise<any>;

    /**
     * A helper function called whenever the clients (shard) is ready or resumed
     * @param client The client that is ready or resumed
     */
    public async initialise(_client: HandlerClient): Promise<any> { return null; }

    /**
     * A helper function called whenever the clients (shard) has an error or disconnects
     * @param client The client that has disconnected or has an error
     */
    public async finalise(_client: HandlerClient): Promise<any> { return null; }

    /**
     * A helper function called after the client has logged in but before command listeners are registered
     * @param client The client that has logged in
     */
    public async setup(_client: HandlerClient): Promise<any> { return null; }

    /** A type guard to check if this command supports (implements) autocomplete  */
    public hasAutocomplete(): this is Autocomplete { return 'autocomplete' in this }
}
