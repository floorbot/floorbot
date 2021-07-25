import { HandlerContext, CommandClient, HandlerEmbed } from 'discord.js-commands';
import { AdminHandler, GuildHandler } from '../../../..';
import { Guild, Client } from 'discord.js';

export class AdminEmbedFactory {

    public static async fetchCommandsEmbed(handler: AdminHandler, context: HandlerContext): Promise<HandlerEmbed> {
        const { client, guild } = <{ client: Client, guild: Guild }>context;
        if (!(client instanceof CommandClient)) throw context;

        const groupHandlers = new Map();
        for (const handler of client.handlers) {
            if (!(handler instanceof GuildHandler)) continue;
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

        return handler.getEmbedTemplate(context)
            .setTitle(`Commands for ${guild.name}`)
            .setDescription(lines.join('\n'))
    }
}
