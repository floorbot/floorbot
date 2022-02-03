import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from "../../helpers/mixins/ResourceMixins.js";
import { ActionRowBuilder } from "../../lib/discord/builders/ActionRowBuilder.js";
import { ReplyBuilder } from "../../lib/discord/builders/ReplyBuilder.js";
import { MixinConstructor } from "../../lib/ts-mixin-extended.js";
import { voteStrings } from "./DisputeMessageHandler.js";
import { GuildMember, Message, Util } from "discord.js";
import { DisputeResults } from "./DisputeTable.js";

export class DisputeTimeStamp {
    private timestamp;

    constructor(timestamp: number) {
        this.timestamp = timestamp;
    }

    public getTimestamp(): number {
        return this.timestamp;
    }

    public setTimestamp(timestamp: number): void {
        this.timestamp = timestamp;
    }
}

export class DisputeReplyBuilder extends DisputeReplyMixin(ReplyBuilder) { };

export function DisputeReplyMixin<T extends MixinConstructor<ReplyBuilder>>(Builder: T) {
    return class DisputeReplyBuilder extends Builder {

        public addDisputeEmbed(message: Message, results: DisputeResults, votes: voteStrings, targetTimestamp: number): this {
            const intMember = this.context!.member! as GuildMember;
            const newTargetTimestamp = Math.round(targetTimestamp / 1000);
            const { yes_array, no_array } = votes;
            const yes_string = yes_array.join('\n') || '';
            const no_string = no_array.join('\n') || '';
            const embed = this.createEmbedBuilder()
                .setTitle(`Do you agree with ${intMember.displayName}'s decision to dispute this statement?`)
                .setDescription([`${intMember.displayName} thinks that ${message.member!.displayName} is full of shit.`,
                    ``,
                Util.splitMessage(`> ${message.content} - ${message.author}`, { char: '', append: '...', maxLength: 250 })[0]!,
                    ``,
                `Vote Ends: <t:${newTargetTimestamp}:R>`].join('\n'))
                .addField(`*Yes Votes: ${results.yes_votes}*`, (`${yes_string ? yes_string : 'None'}`), true)
                .addField(`*No Votes: ${results.no_votes}*`, (`${no_string ? no_string : 'None'}`), true)
                .setURL(message.url);
            return this.addEmbed(embed);
        }

        public addDisputeFinalEmbed(message: Message, results: DisputeResults): this {
            const embed = this.createEmbedBuilder()
                .setTitle(`Turns out that ${message.member!.displayName} was${results.successful_pct > 50 ? '' : ' not'} full of shit.`)
                .setDescription([`This dispute ${results.successful_pct > 50 ? 'succeeded with' : 'failed with only'} ${results.successful_pct_rounded}% agreeing.`,
                    ``,
                Util.splitMessage(`> ${message.content} - ${message.author}`, { char: '', append: '...', maxLength: 250 })[0]!].join('\n'))
                .setURL(message.url);
            return this.addEmbed(embed);
        }

        public addDisputeSelfUsedEmbed(): this {
            const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.MAD);
            const embed = this.createEmbedBuilder()
                .setThumbnail(attachment.getEmbedUrl())
                .setDescription(`You can't dispute yourself, you fucking idiot. How can you be so fucking stupid??`);
            this.addFile(attachment);
            this.addEmbed(embed);
            this.setEphemeral();
            return this;
        }

        public addDisputeAlreadyDisputedEmbed(results: DisputeResults): this {
            const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.MAD);
            const embed = this.createEmbedBuilder()
                .setThumbnail(attachment.getEmbedUrl())
                .setDescription([`That message has already been disputed by <@${results.dispute_user_id}>, you fucking idiot. How can you be so fucking stupid??`,
                    ``,
                `That dispute had ${results.total_votes} votes and ${results.successful_pct > 50 ?
                    `succeeded with ${results.successful_pct_rounded}% agreeing that <@${results.dispute_user_id}> was full of shit.` :
                    `failed with only ${results.successful_pct_rounded}% agreeing.`}`].join('\n'));
            this.addFile(attachment);
            this.addEmbed(embed);
            this.setEphemeral();
            return this;
        }

        public addDisputeNotEnoughVotesEmbed(): this {
            const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.MAD);
            const embed = this.createEmbedBuilder()
                .setThumbnail(attachment.getEmbedUrl())
                .setDescription(`Not enough people voted. This dispute has been cancelled.`);
            this.addFile(attachment);
            this.addEmbed(embed);
            this.clearComponents();
            return this;
        }

        public addDisputeActionRow(): this {
            const actionRow = new ActionRowBuilder()
                .addYesButton()
                .addNoButton();
            return this.addActionRow(actionRow);
        }
    };
}
