import { HandlerEmbed } from '../../../components/HandlerEmbed';
import { MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { HandlerContext } from '../../../discord/Util';
import { GroupHandlerMap } from './AdminHandler';

export class AdminEmbed extends HandlerEmbed {

    constructor(context: HandlerContext, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(context);
    }

    public static createCommandsEmbed(context: HandlerContext, groupHandlerMap: GroupHandlerMap): AdminEmbed {
        const embed = new AdminEmbed(context).setTitle(`Commands for ${context.guild!.name}`);
        groupHandlerMap.forEach((handlerMap, group) => {
            const lines: string[] = [];
            // lines.push(`__${group} Commands__`)
            handlerMap.forEach(({ handler, appCommand }) => {
                const prefix = (handler.data.type === 'MESSAGE' || handler.data.type === 'USER') ? '☰ ' : '/'
                // lines.push(`${appCommand ? '🟢' : '🔴'} \`${prefix}${handler.data.name}${handler.nsfw ? '\*' : ''}\` - *${handler.description}*`);
                lines.push(`${appCommand ? '🟢' : '🔴'} \`${prefix}${handler.data.name}${handler.nsfw ? '\*' : ''}\``);
            });
            embed.addField(`${group} Commands`, lines.join('\n'), true)
        })

        return embed;
    }

    // public static createCommandsEmbed(context: HandlerContext, groupHandlerMap: GroupHandlerMap): AdminEmbed {
    //     const lines: string[] = [];
    //     groupHandlerMap.forEach((handlerMap, group) => {
    //         lines.push(`__${group} Commands__`)
    //         handlerMap.forEach(({ handler, appCommand }) => {
    //             const prefix = (handler.data.type === 'MESSAGE' || handler.data.type === 'USER') ? '☰ ' : '/'
    //             // lines.push(`${appCommand ? '🟢' : '🔴'} \`${prefix}${handler.data.name}${handler.nsfw ? '\*' : ''}\` - *${handler.description}*`);
    //             lines.push(`${appCommand ? '🟢' : '🔴'} \`${prefix}${handler.data.name}${handler.nsfw ? '\*' : ''}\``);
    //         })
    //     })
    //
    //     return new AdminEmbed(context)
    //         .setTitle(`Commands for ${context.guild!.name}`)
    //         .setDescription(lines.join('\n'));
    // }
}
