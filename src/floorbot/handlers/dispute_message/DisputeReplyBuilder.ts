import { ButtonActionRowBuilder, ButtonComponentID } from "../../../lib/discord/builders/ButtonActionRowBuilder.js";
import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from "../../../lib/builders/ResourceMixins.js";
import { ReplyBuilder } from "../../../lib/discord/builders/ReplyBuilder.js";
import { DiscordUtil } from '../../../lib/discord/DiscordUtil.js';
import { DisputeVoteRow } from './tables/DisputeVoteTable.js';
import { DisputeRow } from './tables/DisputeTable.js';
import { APIMessage } from 'discord-api-types/v10';
import { Message } from "discord.js";

export class DisputeReplyBuilder extends ReplyBuilder {

    public addDisputeEmbed(dispute: DisputeRow, disputeVotes: DisputeVoteRow[], endTime?: number): this {
        const embed = this.createEmbedBuilder()
            .setTitle('Message Dispute')
            .setURL(`https://discord.com/channels/${dispute.guild_id ?? '@me'}/${dispute.channel_id}/${dispute.message_id}`)
            .setDescription([
                ...(endTime ? [`Do you agree with the following statement?`, '',] : []),
                `<@${dispute.disputee_id}>: "${DiscordUtil.shortenMessage(dispute.content, { maxLength: 1024, append: '...' })}"`,
                '',
                ...(endTime ?
                    [`Vote ends <t:${Math.floor(endTime / 1000)}:R>`] :
                    [`Vote ended <t:${Math.floor(dispute.epoch / 1000)}:R>`]),
            ])
            .addFields({
                name: 'Agree',
                value: disputeVotes.reduce((value, voter) => value.concat(voter.vote === ButtonComponentID.Agree ? `<@${voter.user_id}>\n` : ''), '') || '*None*',
                inline: true
            }, {
                name: 'Disagree',
                value: disputeVotes.reduce((value, voter) => value.concat(voter.vote === ButtonComponentID.Disagree ? `<@${voter.user_id}>\n` : ''), '') || '*None*',
                inline: true
            });
        return this.addEmbed(embed);
    }

    public addDisputeSelfEmbed(): this {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.CHEEKY);
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription('You can\'t dispute yourself, silly!');
        this.addFile(attachment);
        this.addEmbed(embed);
        return this;
    }

    public addDisputeFailedEmbed(): this {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.SAD);
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                'Sorry! There weren\'t enough votes to conclude this dispute...',
                '*The vote is cancelled and you can dispute this message again*'
            ]);
        this.addFile(attachment);
        this.addEmbed(embed);
        return this;
    }

    public addDisputeActionRow(message: APIMessage | Message): this {
        const url = message instanceof Message ?
            `https://discord.com/channels/${message.guildId ?? '@me'}/${message.channelId}/${message.id}` :
            `https://discord.com/channels/${message.guild_id ?? '@me'}/${message.channel_id}/${message.id}`;
        const actionRow = new ButtonActionRowBuilder()
            .addViewMessageButton(url)
            .addAgreeButton()
            .addDisagreeButton();
        return this.addActionRow(actionRow);
    }
}
