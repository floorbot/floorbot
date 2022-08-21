import { AttachmentFactory, AvatarExpression } from './AttachmentFactory.js';
import { ReplyBuilder } from '../../discord/builders/ReplyBuilder.js';
import { EmbedBuilder } from 'discord.js';

export class FloorbotReply extends ReplyBuilder {

    public static guildOnly(): FloorbotReply {
        const attachment = AttachmentFactory.avatarExpression({ expression: AvatarExpression.Frown });
        const embed = new EmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! It looks like I can only use this feature in guilds!`,
                '*Make sure you try using this in an appropriate guild!*'
            ].join('\n'));
        return new FloorbotReply()
            .setEmbeds(embed)
            .setFiles(attachment)
            .setEphemeral(true);
    }
}
