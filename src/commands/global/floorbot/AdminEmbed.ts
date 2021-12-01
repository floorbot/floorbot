import { Interaction, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { HandlerEmbed } from '../../../discord/helpers/components/HandlerEmbed.js';
import { GroupHandlerMap } from './FloorbotHandler.js';

export class AdminEmbed extends HandlerEmbed {

    constructor(interaction: Interaction, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(interaction);
    }

    public static createCommandsEmbed(interaction: Interaction<'cached'>, groupHandlerMap: GroupHandlerMap): AdminEmbed {
        const embed = new AdminEmbed(interaction).setTitle(`Commands for ${interaction.guild.name}`);
        groupHandlerMap.forEach((handlerMap, group) => {
            const lines: string[] = [];
            handlerMap.forEach((appCommand, handler) => {
                const description = 'description' in handler.data ? handler.data.description : '*No Description*';
                lines.push(`${appCommand ? '🟢' : '🔴'} \`${handler.toString()}${handler.nsfw ? '\*' : ''}\` - *${description}*`);
            });
            embed.addField(`${group} Commands`, lines.join('\n'), false)
        })
        return embed;
    }
}
