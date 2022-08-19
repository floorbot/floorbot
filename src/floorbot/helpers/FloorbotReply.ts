import { EmbedBuilder } from '../../lib/builders/EmbedBuilder.js';
import { ReplyBuilder } from '../../lib/builders/ReplyBuilder.js';
import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from './ResourceMixins.js';

export class FloorbotReply extends ReplyBuilder {

    public static guildOnly(): FloorbotReply {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.FROWN);
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
