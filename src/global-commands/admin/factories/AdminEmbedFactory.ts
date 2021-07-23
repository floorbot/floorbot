import { EmbedFactory, HandlerContext, CommandClient, HandlerEmbed } from 'discord.js-commands';
import { AdminHandler, GuildCommandHandler } from '../../../..';
import { Guild, Client } from 'discord.js';

export class AdminEmbedFactory extends EmbedFactory<AdminHandler> {

    constructor(handler: AdminHandler) {
        super(handler);
    }

    public async fetchCommandsEmbed(context: HandlerContext): Promise<HandlerEmbed> {
        const { client, guild } = <{ client: Client, guild: Guild }>context;
        if (!(client instanceof CommandClient)) throw context;

        const groupHandlers = new Map();
        for (const handler of client.handlers) {
            if (!(handler instanceof GuildCommandHandler)) continue;
            if (!groupHandlers.has(handler.group)) groupHandlers.set(handler.group, []);
            groupHandlers.get(handler.group)!.push(handler);
        }

        const lines = [];
        for (const [group, handlers] of Array.from(groupHandlers)) {
            lines.push(`__${group} Commands__`)
            for (const handler of handlers) {
                const enabled = await handler.fetchCommand(guild);
                lines.push(`${enabled ? '🟢' : '🔴'} \`/${handler.id}${handler.nsfw ? '\*' : ''}\` - *${handler.commandData.description}*`)
            }
        }
        return new HandlerEmbed(context)
            .setTitle(`Commands for ${guild.name}`)
            .setDescription(lines.join('\n'))
    }
}
