import { Awaitable, Client, CollectedInteraction, Collection, Events, InteractionCollector, InteractionCollectorOptions, Message, Snowflake } from 'discord.js';
import { ReplyBuilder } from './builders/ReplyBuilder.js';

/** The ComponentCollector constructor options type */
export interface ComponentCollectorOptions<T extends CollectedInteraction> extends InteractionCollectorOptions<T> {
    endHandler?: ComponentCollectorEndHandler;
}

/** The different ComponentCollector end handlers available */
export enum ComponentCollectorEndHandler {
    Delete = 'delete',
    None = 'none'
}

/** A discord.js InteractionCollector with end handler functionality */
export class ComponentCollector<T extends CollectedInteraction> extends InteractionCollector<T> {

    /** What end handler the collector should use */
    public endHandler?: ComponentCollectorEndHandler;

    constructor(client: Client, options?: ComponentCollectorOptions<T>) {
        super(client, options);
        // Redirect all errors to the client
        this.on(Events.Error, ((error: any) => {
            const collectorError = new Error(`InteractionCollector "${error}" encountered an error`, error);
            this.client.emit(Events.Error, collectorError);
        }));

        if (!options) return;
        this.endHandler = options.endHandler;
        if (options.message && options.message instanceof Message) {
            let message = options.message;
            this.on('end', async () => {
                switch (this.endHandler) {
                    case ComponentCollectorEndHandler.Delete: {
                        message = await message.fetch();
                        const replyOptions = ReplyBuilder.fromMessage(message).clearComponents();
                        await message.edit(replyOptions);
                        break;
                    };
                    case ComponentCollectorEndHandler.None:
                    default: break;
                }
            });
        }
    }

    // Adds option for returning anything instead of void
    public override on(event: 'collect' | 'dispose' | 'ignore', listener: (interaction: T) => Awaitable<void>): this;
    public override on(event: 'end', listener: (collected: Collection<Snowflake, T>, reason: string) => Awaitable<void>): this;
    public override on(event: string, listener: (...args: any[]) => Awaitable<void>): this;
    public override on(event: 'collect', listener: (...args: any[]) => Awaitable<any>): this; // Additional
    public override on(event: string, listener: (...args: any[]) => Awaitable<any>): this {
        // Need to proxy these so we can catch and emit errors without crashing
        return super.on(event, async (...args: any[]) => {
            try { await listener(...args); }
            catch (error) { this.emit(Events.Error, error); }
        });
    }

    public override once(event: 'collect' | 'dispose' | 'ignore', listener: (interaction: T) => Awaitable<void>): this;
    public override once(event: 'end', listener: (collected: Collection<Snowflake, T>, reason: string) => Awaitable<void>): this;
    public override once(event: string, listener: (...args: any[]) => Awaitable<void>): this;
    public override once(event: 'collect', listener: (...args: any[]) => Awaitable<any>): this; // Additional
    public override once(event: string, listener: (...args: any[]) => Awaitable<any>): this {
        // Need to proxy these so we can catch and emit errors without crashing
        return super.once(event, async (...args: any[]) => {
            try { await listener(...args); }
            catch (error) { this.emit(Events.Error, error); }
        });
    }
}
