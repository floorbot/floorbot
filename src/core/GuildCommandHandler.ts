import { HandlerOptions, CommandHandler, HandlerResult, HandlerContext } from 'discord.js-commands';
import { Guild, ApplicationCommand, ApplicationCommandData, CommandInteraction } from 'discord.js';
import { CommonHandler } from '../..';

export enum GuildCommandHandlerGroup {
    BOORU = 'Booru',
    FUN = 'Fun'
}

export interface GuildCommandHandlerOptions extends HandlerOptions {
    readonly commandData: ApplicationCommandData,
    readonly group: GuildCommandHandlerGroup,
}

export abstract class GuildCommandHandler extends CommonHandler implements CommandHandler {

    public readonly commandData: ApplicationCommandData;
    public readonly group: GuildCommandHandlerGroup;

    constructor(options: GuildCommandHandlerOptions) {
        super(options);
        this.commandData = options.commandData;
        this.group = options.group;
    }

    public abstract onCommand(interaction: CommandInteraction): Promise<HandlerResult | null>;

    public override async isEnabled(context: HandlerContext): Promise<boolean> {
        return Boolean(await this.fetchCommand(<Guild>context.guild))
    }

    public async fetchCommand(guild: Guild): Promise<ApplicationCommand | null> {
        const cachedCommands = guild.commands.cache.array();
        const cacheFound = cachedCommands.find(command => command.name === this.commandData.name);
        if (cacheFound) return cacheFound;
        const commands = await guild.commands.fetch();
        const found = commands.find(command => command.name === this.commandData.name);
        return found || null;
    }

    public async enable(guild: Guild, _context: HandlerContext): Promise<ApplicationCommand | null> {
        const found = await this.fetchCommand(guild);
        return found || guild.commands.create(this.commandData);
    }

    public async disable(guild: Guild, _context: HandlerContext): Promise<ApplicationCommand | null> {
        const found = await this.fetchCommand(guild);
        return found ? found.delete() : null;
    }
}
