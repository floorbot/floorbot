import { ButtonHandler, CommandHandler, HandlerContext, HandlerCustomData, HandlerResult, SelectMenuHandler, HandlerOptions, BaseHandler, CommandClient, HandlerEmbed } from 'discord.js-commands';
import { Guild, ApplicationCommand, GuildChannel, GuildMember, ButtonInteraction, SelectMenuInteraction, CommandInteraction, ApplicationCommandData } from 'discord.js';
import * as nconf from 'nconf';

export interface GlobalHandlerOptions extends HandlerOptions {
    readonly commandData: ApplicationCommandData,
    readonly permissions?: bigint[]
}

export class GlobalHandler<T extends HandlerCustomData> extends BaseHandler implements CommandHandler, ButtonHandler<T>, SelectMenuHandler<T> {

    public readonly commandData: ApplicationCommandData;
    public readonly permissions: bigint[];

    constructor(options: GlobalHandlerOptions) {
        super(options);
        this.permissions = options.permissions || [];
        this.commandData = options.commandData;
    }

    public onCommand(interaction: CommandInteraction): Promise<HandlerResult | null | any> { throw { interaction }; }

    public onButton(interaction: ButtonInteraction, customData: T): Promise<HandlerResult | null | any> { throw { interaction, customData } };
    public decodeButton(customString: string): T { return JSON.parse(customString); }
    public encodeButton(customData: T): string { return JSON.stringify(customData); }

    public onSelectMenu(interaction: SelectMenuInteraction, customData: T): Promise<HandlerResult | null | any> { throw { interaction, customData } };
    public decodeSelectMenu(customString: string): T { return JSON.parse(customString); }
    public encodeSelectMenu(customData: T): string { return JSON.stringify(customData); }

    public getEmbedTemplate(context: HandlerContext, _customData?: T): HandlerEmbed {
        return new HandlerEmbed().setContextAuthor(context);
    }

    public override async isEnabled(context: HandlerContext): Promise<boolean> {
        return Boolean(await this.fetchCommand(<CommandClient>context.client))
    }

    public override async isAuthorised(context: HandlerContext, _customData?: HandlerCustomData): Promise<string[]> {
        const { member, channel } = <{ member: GuildMember, channel: GuildChannel }>context;
        const devs = nconf.get('devs');
        if (devs && Array.isArray(devs)) {
            if (devs.includes(member.user.id)) return [];
        }
        const permissions = member.permissionsIn(channel);
        return permissions.missing(this.permissions, false);
    }

    public async fetchCommand(scope: CommandClient | Guild): Promise<ApplicationCommand | null> {
        const client = scope instanceof CommandClient ? scope : scope.client;
        const application = client.application!;
        const cachedCommands = application.commands.cache.array();
        const cacheFound = cachedCommands.find(command => command.name === this.commandData.name);
        if (cacheFound) return cacheFound;
        const commands = await application.commands.fetch();
        const found = commands.find(command => command.name === this.commandData.name);
        return found || null;
    }
}
