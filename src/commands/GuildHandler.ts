import { Guild, ApplicationCommand, GuildChannel, GuildMember, InteractionReplyOptions } from 'discord.js';
import { HandlerAttachment, HandlerContext, HandlerCustomData } from 'discord.js-commands';
import { GlobalHandler, GlobalHandlerOptions } from '../..';
import * as fs from 'fs';

export enum GuildHandlerGroup {
    ANIME = 'Anime',
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

    public override async isAuthorised(context: HandlerContext, _customData?: T): Promise<string[]> {
        const { member, channel } = <{ member: GuildMember, channel: GuildChannel }>context;
        const permissions = member.permissionsIn(channel);
        return permissions.missing(this.permissions, false);
    }

    public override async fetchCommand(guild: Guild): Promise<ApplicationCommand | null> {
        const cachedCommands = guild.commands.cache;
        const cacheFound = cachedCommands.find(command => command.name === this.commandData.name);
        if (cacheFound) return cacheFound;
        const commands = await guild.commands.fetch();
        const found = commands.find(command => command.name === this.commandData.name);
        return found || null;
    }

    public async enable(context: HandlerContext, _customData?: T): Promise<ApplicationCommand | null> {
        const found = await this.fetchCommand(context.guild!);
        return found || context.guild!.commands.create(this.commandData);
    }

    public async disable(context: HandlerContext, _customData?: T): Promise<ApplicationCommand | null> {
        const found = await this.fetchCommand(context.guild!);
        return found ? found.delete() : null;
    }

    public override getHandlerNSFWResponse(context: HandlerContext, customData?: T): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${__dirname}/../../res/thumbnails/nsfw.png`);
        const attachment = new HandlerAttachment(buffer, 'nsfw.png');
        const embed = this.getEmbedTemplate(context, customData)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Crikey! I'm not so sure \`${this.id}\` is safe enough to use here.`,
                'Lets move this to a nsfw channel where we can go crazy!'
            ].join('\n'));
        return { embeds: [embed], files: [attachment] }
    }

    public getNotFoundResponse(context: HandlerContext, query: any): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${__dirname}/../../res/thumbnails/404.png`);
        const attachment = new HandlerAttachment(buffer, '404.png');
        const embed = this.getEmbedTemplate(context)
            .setContextAuthor(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I could not find \`${query}\``,
                '*Please check your spelling or try again later!*'
            ].join('\n'));
        return { embeds: [embed], files: [attachment] }
    }

    public getInvalidInputResponse(context: HandlerContext, input: String): InteractionReplyOptions {
        return this.getEmbedTemplate(context).setDescription(
            `Sorry! I'm not sure how to resolve \`${input}\`\n` +
            '*Please check your spelling or try again later!*'
        ).toReplyOptions();
    }
}
