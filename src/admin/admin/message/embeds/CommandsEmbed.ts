import { HandlerContext, CommandHandler } from 'discord.js-commands';
import { Collection, ApplicationCommand } from 'discord.js';
import { AdminEmbed } from '../AdminEmbed';

export class CommandsEmbed extends AdminEmbed {

    constructor(context: HandlerContext, guildCommands: Collection<any, ApplicationCommand>, guildHandlers: Collection<string, Array<CommandHandler>>) {
        super(context);
        this.setTitle(`Commands for ${context.guild!.name}`);
        this.setDescription(guildHandlers.map((handlers, group) => {
            return (
                `__${group} Commands__\n` +
                (handlers.map((handler) => {
                    const enabled = guildCommands.some(command => command.name === handler.commandData.name);
                    return `${enabled ? '🟢' : '🔴'} \`/${handler.id}${handler.nsfw ? '\*' : ''}\` - *${handler.commandData.description}*`;
                }).join('\n')))
        }).join('\n'))

    }
}
