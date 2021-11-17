import { Client, ClientOptions, Constants, Interaction, PresenceData } from 'discord.js';
import { HandlerEmbed } from '../components/HandlerEmbed.js';
import exitHook from 'async-exit-hook';
import { Handler } from './Handler';

const { Events, ApplicationCommandTypes } = Constants;

export interface HandlerClientOptions extends ClientOptions {
    readonly handlerBuilders: ((client: HandlerClient) => Handler<any>)[],
    readonly handlers: Handler<any>[],
    readonly ownerIds?: string[],
}

export class HandlerClient extends Client {

    private readonly presenceData?: PresenceData;

    public readonly handlers: Handler<any>[];
    public readonly ownerIds: string[];

    constructor(options: HandlerClientOptions) {
        const handlerIntents = options.handlers.map(handler => handler.intents);
        super({ ...options, intents: [options.intents, ...handlerIntents], presence: { status: 'invisible' } });
        this.ownerIds = options.ownerIds || [];
        this.presenceData = options.presence;
        this.handlers = options.handlers;
        for (const builder of options.handlerBuilders) {
            const handler = builder(this);
            this.handlers.push(handler);
        }
    }

    public override async login(token?: string): Promise<string> {
        const string = await super.login(token);
        for (const handler of this.handlers.values()) await handler.setup(this);
        this.on(Events.SHARD_READY, async (_id, _unavailableGuilds) => { for (const handler of this.handlers.values()) await handler.initialise(this); });
        this.on(Events.SHARD_RESUME, async (_id, _replayedEvents) => { for (const handler of this.handlers.values()) await handler.initialise(this); });
        this.on(Events.SHARD_DISCONNECT, async (_event, _id) => { for (const handler of this.handlers.values()) await handler.finalise(this); });
        this.on(Events.SHARD_ERROR, async (_error, _id) => { for (const handler of this.handlers.values()) await handler.finalise(this); });
        this.on(Events.INTERACTION_CREATE, this.onInteractionCreate);
        exitHook((done) => this.onExitHook(done));
        if (this.user) this.user.setPresence(this.presenceData || { status: 'online' });
        this.emit('log', `[login] Logged in as <${this.user!.tag}>`);
        return string;
    }

    private async onInteractionCreate(interaction: Interaction): Promise<any> {
        const { channel } = interaction;
        if (interaction.isApplicationCommand() || interaction.isAutocomplete()) {
            for (const handler of this.handlers) {
                if (handler.data.name !== interaction.commandName) continue;
                if (interaction.isAutocomplete() && handler.hasAutocomplete()) return handler.autocomplete(interaction).catch(() => { });
                if (!(interaction! instanceof handler.type)) continue;
                switch (true) {
                    case (handler.data.type === undefined && interaction.isCommand()):
                    case (handler.data.type === ApplicationCommandTypes.USER && interaction.isContextMenu()):
                    case (handler.data.type === ApplicationCommandTypes.CHAT_INPUT && interaction.isCommand()):
                    case (handler.data.type === ApplicationCommandTypes.MESSAGE && interaction.isContextMenu()): {
                        if (channel && handler.nsfw) {
                            switch (channel.type) {
                                case "DM": break;
                                case "GUILD_TEXT":
                                case "GUILD_NEWS": {
                                    if (!channel.nsfw) return interaction.reply(new HandlerEmbed().setDescription([
                                        `Sorry! The \`${interaction.commandName}\` command can only be used in \`NSFW\` channels 😏`,
                                        '*Try a different channel or make this one NSFW if it is appropriate!*'
                                    ]).toReplyOptions({ ephemeral: true })).catch(() => { });
                                    else break;
                                }
                                case "GUILD_PRIVATE_THREAD":
                                case "GUILD_PUBLIC_THREAD":
                                case "GUILD_NEWS_THREAD": {
                                    if (!channel.parent || !channel.parent.nsfw) return interaction.reply(new HandlerEmbed().setDescription([
                                        `Sorry! The \`${interaction.commandName}\` command can only be used in \`NSFW\` channels 😏`,
                                        '*Try a different channel or make this one NSFW if it is appropriate!*'
                                    ]).toReplyOptions({ ephemeral: true })).catch(() => { });
                                    else break;
                                }
                                default: return this.emit('log', `[support](nsfw) Unknown channel type <${(<any>channel).type}> for checking NSFW support`);
                            }
                        }
                        return handler.execute(interaction).catch(error => {
                            this.emit('error', error);
                            return interaction.followUp(new HandlerEmbed().setDescription([
                                `Sorry! I seem to have run into an issue with your \`${interaction.commandName}\` command 😦`,
                                `*The error has been reported and will be fixed in the future!*`
                            ]).toReplyOptions({ ephemeral: true }));
                        }).catch(() => { });
                    }
                    default: return this.emit('log', `[support](interaction) Unknown application command interaction <${interaction.constructor.name}>`);
                }
            }
        }
    }

    private async onExitHook(done: () => void): Promise<void> {
        this.emit('log', '[exit-hook] Finalising all handlers before exiting');
        for (const handler of this.handlers.values()) await handler.finalise(this);
        this.destroy();
        return done();
    }
}
