import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from '../../lib/builders/ResourceMixins.js';
import { PageableButtonActionRowBuilder } from '../../lib/builders/PageableButtonActionRowBuilder.js';
import { ReplyBuilder } from '../../lib/discord/builders/ReplyBuilder.js';
import { BooruRow } from '../booru/tables/BooruTable.js';
import { Pageable } from '../../lib/Pageable.js';
import { GuildMember, User } from 'discord.js';


export class SavedReplyBuilder extends ReplyBuilder {

    public addNoSavedBoorusEmbed(user: User): this {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.SAD);
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! It looks like ${user} has no saved boorus...`,
                '*Pressing the heart button on a booru will save it!*'
            ]);
        this.addFile(attachment);
        this.addEmbed(embed);
        return this;
    }

    public addSavedBoorusEmbed(scope: User | GuildMember, pageable: Pageable<BooruRow>): this {
        const displayName = scope instanceof GuildMember ? scope.displayName : scope.username;
        const booru = pageable.getPageFirst();
        const embed = this.createEmbedBuilder()
            .setTitle(`${displayName}'s Saved Boorus`)
            .setImage(booru.image_url)
            .setDescription([
                `Post: **[${booru.api_name}](${booru.post_url})**`,
                '',
                ...(/\.swf$/.test(booru.image_url) ? [`Sorry! This is a flash file 🙃\n*click the [link](${booru.post_url}) to view in browser*`] : []),
                ...(/(\.webm$)|(\.mp4$)/.test(booru.image_url) ? [`Sorry! This is a \`webm\` or \`mp4\` file which is not supported in embeds... 😕\n*click the [link](${booru.post_url}) to view in browser*`] : [])
            ])
            .setFooter({ text: `Source: ${booru.api_name} - Page: ${pageable.currentPage + 1}/${pageable.totalPages}`, iconURL: booru.api_icon_url });
        return this.addEmbed(embed);
    }

    public addSavedBoorusActionRow(pageable: Pageable<BooruRow>): this {
        const booru = pageable.getPageFirst();
        const actionRow = new PageableButtonActionRowBuilder()
            .addViewOnlineButton(booru.post_url)
            .addPreviousPageButton()
            .addNextPageButton()
            .addRemoveButton();
        return this.addActionRow(actionRow);
    }
}
