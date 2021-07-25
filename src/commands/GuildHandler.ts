import { Guild, ApplicationCommand, GuildChannel, GuildMember, InteractionReplyOptions } from 'discord.js';
import { HandlerContext, HandlerCustomData } from 'discord.js-commands';
import { GlobalHandler, GlobalHandlerOptions } from '../..';

export enum GuildHandlerGroup {
    BOORU = 'Booru',
    FUN = 'Fun'
}

export interface GuildHandlerOptions extends GlobalHandlerOptions {
    readonly group: GuildHandlerGroup
}

export class GuildHandler<T extends HandlerCustomData> extends GlobalHandler<T> {

    public readonly group: GuildHandlerGroup;

    constructor(options: GuildHandlerOptions) {
        super(options);
        this.group = options.group;
    }

    public override async isEnabled(context: HandlerContext): Promise<boolean> {
        return Boolean(await this.fetchCommand(<Guild>context.guild))
    }

    public override async isAuthorised(context: HandlerContext, _customData?: HandlerCustomData): Promise<string[]> {
        const { member, channel } = <{ member: GuildMember, channel: GuildChannel }>context;
        const permissions = member.permissionsIn(channel);
        return permissions.missing(this.permissions);
    }

    public override async fetchCommand(guild: Guild): Promise<ApplicationCommand | null> {
        const cachedCommands = guild.commands.cache.array();
        const cacheFound = cachedCommands.find(command => command.name === this.commandData.name);
        if (cacheFound) return cacheFound;
        const commands = await guild.commands.fetch();
        const found = commands.find(command => command.name === this.commandData.name);
        return found || null;
    }

    public async enable(context: HandlerContext, _customData?: HandlerCustomData): Promise<ApplicationCommand | null> {
        const found = await this.fetchCommand(context.guild!);
        return found || context.guild!.commands.create(this.commandData);
    }

    public async disable(context: HandlerContext, _customData?: HandlerCustomData): Promise<ApplicationCommand | null> {
        const found = await this.fetchCommand(context.guild!);
        return found ? found.delete() : null;
    }

    public getNotFoundResponse(context: HandlerContext, query: string): InteractionReplyOptions {
        return this.getEmbedTemplate(context).setDescription(
            `Sorry! I could not find \`${query}\` 😟\n` +
            '*Please check your spelling or try again later!*'
        ).toReplyOptions();
    }

    public getInvalidInputResponse(context: HandlerContext, input: String): InteractionReplyOptions {
        return this.getEmbedTemplate(context).setDescription(
            `Sorry! I'm not sure how to resolve \`${input}\`\n` +
            '*Please check your spelling or try again later!*'
        ).toReplyOptions();
    }
}
