import { Client, ClientOptions, Collection, Interaction, Constants, ApplicationCommand, Guild, CloseEvent } from 'discord.js';
import * as exitHook from 'async-exit-hook';
import { Handler } from './Handler';
import { Pool } from 'mariadb';
import * as fs from 'fs';

const { Events } = Constants;

export interface CommandHandlerSchema {
    readonly application_id: string,
    readonly command_id: string,
    readonly guild_id: string | null,
    readonly handler_id: string
}

export interface HandlerClientOptions extends ClientOptions {
    readonly pool: Pool;
}

export class HandlerClient extends Client {

    private readonly handlers: Collection<string, Handler>;
    private readonly pool: Pool;

    // Static factory method to allow async setup before constructor
    public static async create(options: HandlerClientOptions): Promise<HandlerClient> {
        const sql = fs.readFileSync(`${__dirname}/../../res/schemas/command_handler.sql`, 'utf8');
        await options.pool.query(sql).catch(error => { if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error; });
        const provider = new HandlerClient(options);
        return provider;
    }

    // Private constructor to prevent unwanted instancing
    private constructor(options: HandlerClientOptions) {
        super(options);
        this.handlers = new Collection();
        this.pool = options.pool;
    }

    public getAllHandlers() {
        return [...this.handlers.values()];
    }

    public async addHandlers(...handlers: Handler[]): Promise<this> {
        for (const handler of handlers) {
            if (this.isReady()) await handler.setup(this);
            this.handlers.set(handler.id, handler);
        }
        return this;
    }

    public async fetchHandler(interaction: Interaction): Promise<Handler | null> {
        if (interaction.isCommand() || interaction.isContextMenu() || interaction.isAutocomplete()) {
            const query = { application_id: interaction.applicationId, command_id: interaction.commandId };
            const sql = 'SELECT * FROM command_handler WHERE application_id = :application_id AND command_id = :command_id LIMIT 1;';
            const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, query);
            const row = rows.length ? rows[0] as CommandHandlerSchema : null;
            if (row) return this.handlers.get(row.handler_id) ?? null;
        }
        return null;
    }

    public async fetchGuildAppCommand(handler: Handler, guild: Guild): Promise<CommandHandlerSchema | null> {
        const query = { application_id: this.application!.id, handler_id: handler.id, guild_id: guild.id };
        const sql = 'SELECT * FROM command_handler WHERE application_id = :application_id AND handler_id = :handler_id AND guild_id = :guild_id LIMIT 1;';
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, query);
        const row = rows.length ? rows[0] as CommandHandlerSchema : null;
        return row || null;
    }

    public async fetchCommands(handler: Handler): Promise<CommandHandlerSchema[]> {
        const query = { application_id: this.application!.id, handler_id: handler.id };
        const sql = 'SELECT * FROM command_handler WHERE application_id = :application_id AND handler_id = :handler_id;';
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, query) as CommandHandlerSchema[];
        return rows;
    }

    public async fetchGuildCommands(guild: Guild): Promise<CommandHandlerSchema[]> {
        const query = { application_id: this.application!.id, guild_id: guild.id };
        const sql = 'SELECT * FROM command_handler WHERE application_id = :application_id AND guild_id = :guild_id;';
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, query) as CommandHandlerSchema[];
        return rows;
    }

    public async postCommand(handler: Handler, guild?: Guild): Promise<ApplicationCommand> {
        const manager = guild ? guild.commands : this.application!.commands;
        const appCommand = await manager.create(handler.data);
        const query = { application_id: appCommand.applicationId, command_id: appCommand.id, guild_id: guild ?.id ?? null, handler_id: handler.id };
        const sql = 'REPLACE INTO command_handler VALUES (:application_id, :command_id, :guild_id, :handler_id)';
        await this.pool.query({ namedPlaceholders: true, sql: sql }, query);
        return appCommand;
    }

    public async deleteCommand(query: CommandHandlerSchema, guild: Guild): Promise<void> {
        await guild.commands.delete(query.command_id.toString()).catch(() => { });
        const sql = 'DELETE FROM command_handler WHERE application_id = :application_id AND command_id = :command_id;';
        await this.pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public override async login(token?: string): Promise<string> {
        const string = await super.login(token);
        for (const handler of this.handlers.values()) await handler.setup(this);


        this.on(Events.APPLICATION_COMMAND_DELETE, this.onApplicationCommandDelete);
        this.on(Events.SHARD_READY, this.onShardReady);
        this.on(Events.SHARD_RESUME, this.onShardResume);
        this.on(Events.SHARD_DISCONNECT, this.onShardDisconnect);
        this.on(Events.SHARD_ERROR, this.onShardError);
        exitHook((done) => this.onExitHook(done));
        this.on(Events.INTERACTION_CREATE, this.onInteractionCreate);
        this.emit('log', `[login] Logged in as <${this.user!.tag}>`);
        return string;
    }

    private async onApplicationCommandDelete(appCommand: ApplicationCommand): Promise<void> {
        const query = { application_id: appCommand.applicationId, command_id: appCommand.id };
        const sql = 'DELETE FROM command_handler WHERE application_id = :application_id AND command_id = :command_id;';
        await this.pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    private async onInteractionCreate(interaction: Interaction): Promise<any> {
        const { channel } = interaction;
        const handler = await this.fetchHandler(interaction);
        if (handler && interaction.isAutocomplete()) return handler.autocomplete(interaction);
        if (handler && (interaction.isCommand() || interaction.isContextMenu())) {
            if (channel && handler.nsfw) {
                switch (channel.type) {
                    case "DM": break;
                    case "GUILD_TEXT":
                    case "GUILD_NEWS": {
                        if (!channel.nsfw) return handler.onNSFW(interaction)
                        else break;
                    }
                    case "GUILD_PRIVATE_THREAD":
                    case "GUILD_PUBLIC_THREAD":
                    case "GUILD_NEWS_THREAD": {
                        if (!channel.parent || !channel.parent.nsfw) return handler.onNSFW(interaction)
                        else break;
                    }
                    default: {
                        this.emit('log', `[support](nsfw) Unknown channel type <${(<any>channel).type}> for checking NSFW support`);
                        return handler.onError(interaction);
                    }
                }
            }
            return handler.execute(interaction).catch(console.error);
        }
    }

    private async onShardReady(id: number, unavailableGuilds: Set<string> | undefined): Promise<void> {
        this.emit('log', `[shard-ready] Shard ${id} ready with ${unavailableGuilds ? unavailableGuilds.size : 0} unavailable guilds`);
        for (const handler of this.handlers.values()) await handler.initialise(this);
    }

    private async onShardResume(id: number, replayedEvents: number): Promise<void> {
        this.emit('log', `[shard-resume] Shard ${id} resumed with ${replayedEvents} replayed events`);
        for (const handler of this.handlers.values()) await handler.initialise(this);
    }

    private async onShardDisconnect(event: CloseEvent, id: number): Promise<void> {
        this.emit('log', `[shard-disconnect] Shard ${id} disconnected`, event);
        for (const handler of this.handlers.values()) await handler.finalise(this);
    }

    private async onShardError(error: Error, id: number): Promise<void> {
        this.emit('log', `[shard-error] Shard ${id} encountered an error`, error);
        for (const handler of this.handlers.values()) await handler.finalise(this);
    }

    private async onExitHook(done: () => void): Promise<void> {
        this.emit('log', '[exit-hook] Finalising all handlers before exiting');
        for (const handler of this.handlers.values()) await handler.finalise(this);
        this.destroy();
        return done();
    }
}
