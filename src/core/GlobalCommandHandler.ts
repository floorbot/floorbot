import { HandlerOptions, CommandHandler, HandlerResult, CommandClient, HandlerContext } from 'discord.js-commands';
import { ApplicationCommand, ApplicationCommandData, CommandInteraction } from 'discord.js';
import { CommonHandler, CommonResponseFactory } from '../..';

export interface GlobalCommandHandlerOptions extends HandlerOptions {
    readonly commandData: ApplicationCommandData,
    readonly nsfw: boolean,
}

export abstract class GlobalCommandHandler extends CommonHandler implements CommandHandler {

    abstract override readonly responseFactory: CommonResponseFactory<GlobalCommandHandler>;
    public readonly commandData: ApplicationCommandData;

    constructor(options: GlobalCommandHandlerOptions) {
        super(options);
        this.commandData = options.commandData;
    }

    public abstract onCommand(interaction: CommandInteraction): Promise<HandlerResult | null>;

    public async isEnabled(context: HandlerContext): Promise<boolean> {
        return Boolean(await this.fetchCommand(<CommandClient>context.client))
    }

    public async fetchCommand(client: CommandClient): Promise<ApplicationCommand | null> {
        const application = client.application!;
        const cachedCommands = application.commands.cache.array();
        const cacheFound = cachedCommands.find(command => command.name === this.commandData.name);
        if (cacheFound) return cacheFound;
        const commands = await application.commands.fetch();
        const found = commands.find(command => command.name === this.commandData.name);
        return found || null;
    }
}
