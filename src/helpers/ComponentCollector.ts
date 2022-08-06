import { Client, CollectedInteraction, Events, InteractionCollector, InteractionCollectorOptions, Message } from 'discord.js';
import { ReplyBuilder } from '../lib/discord.js/builders/ReplyBuilder.js';

/** The ComponentCollector constructor options type */
export interface ComponentCollectorOptions<T extends CollectedInteraction> extends InteractionCollectorOptions<T> {
    endHandler?: ComponentCollectorEndHandler;
}

/** The different ComponentCollector end handlers available */
export enum ComponentCollectorEndHandler {
    None = 'none',
    Delete = 'delete'
}

/** A discord.js InteractionCollector with end handler functionality */
export class ComponentCollector<T extends CollectedInteraction> extends InteractionCollector<T> {

    /** What end handler the collector should use */
    public endHandler?: ComponentCollectorEndHandler;

    constructor(client: Client, options?: ComponentCollectorOptions<T>) {
        super(client, options);

        // Redirect all errors to the client
        this.on(Events.Error, ((error: any) => {
            const collectorError = new Error(`InteractionCollector "${error}" encountered an error`, { cause: error });
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
}
