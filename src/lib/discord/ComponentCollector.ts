import { Awaitable, Client, Collection, InteractionCollector, InteractionCollectorOptions, Message, MessageComponentInteraction } from 'discord.js';
import { ReplyBuilder } from './builders/ReplyBuilder.js';

/** The ComponentCollector constructor options type */
export interface ComponentCollectorOptions<T extends MessageComponentInteraction> extends InteractionCollectorOptions<T> {
    endHandler?: ComponentCollectorEndHandler;
}

/** The different ComponentCollector end handlers available */
export enum ComponentCollectorEndHandler {
    None = 'none',
    Delete = 'delete'
}

/** A discord.js InteractionCollector with end handler functionality */
export class ComponentCollector<T extends MessageComponentInteraction> extends InteractionCollector<T> {

    /** What end handler the collector should use */
    public endHandler?: ComponentCollectorEndHandler;

    constructor(client: Client, options?: ComponentCollectorOptions<T>) {
        super(client, options);
        if (options) {
            this.endHandler = options.endHandler;
            if (options.message && options.message instanceof Message) {
                let message = options.message;
                this.on('end', async () => {
                    switch (this.endHandler) {
                        case ComponentCollectorEndHandler.Delete: {
                            message = await message.fetch();
                            const replyOptions = ReplyBuilder.fromMessage(message).clearComponents();
                            return await message.edit(replyOptions);
                        };
                        case ComponentCollectorEndHandler.None:
                        default: return;
                    }
                });
            }
        }
    }

    // Add and implement 'safeCollect' event overload for safe 'collect' event usage
    public override on(event: 'safeCollect', listener: (interaction: T) => Awaitable<any>): this;
    public override on(event: 'collect' | 'dispose', listener: (interaction: T) => Awaitable<any>): this;
    public override on(event: 'end', listener: (collected: Collection<string, T>, reason: string) => Awaitable<any>): this;
    public override on(event: string, listener: (...args: any[]) => Awaitable<any>): this;
    public override on(event: any, listener: any): this {
        if (event !== 'safeCollect') return super.on(event, listener);
        return this.on('collect', (interaction: T) => {
            try { listener(interaction); }
            catch (error: any) { console.error(`[InteractionCollector] Collector failed to handle error...`, error); }
        });
    }
}
