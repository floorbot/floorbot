import { Message, MessageEmbed, MessageEmbedOptions, Interaction, InteractionReplyOptions, GuildMember, Util } from 'discord.js';
import { HandlerAttachment } from '../../../../helpers/components/HandlerAttachment.js';
import { HandlerEmbed } from '../../../../helpers/components/HandlerEmbed.js';
import { DisputeResults } from '../DisputeDatabase.js'
import { readFileSync } from 'fs';
// import humanizeDuration from 'humanize-duration';

export class DisputeEmbed extends HandlerEmbed {

    constructor(interaction: Interaction, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(interaction);
    }

    public static getCurrentEmbed(interaction: Interaction, message: Message, results: DisputeResults, yes_string: string, no_string: string, targetTimestamp: number = 0): DisputeEmbed {
        const endDelay: number = 1000 * 60 * 1;
        const embed = new DisputeEmbed(interaction);
        const intMember = interaction.member! as GuildMember
        let newTargetTimestamp = 0
        // let timeCalc = 0
        if (targetTimestamp == 0) {
            // timeCalc = (Math.round((Date.now() - interaction.createdTimestamp) / 1000) * 1000) + endDelay;
            newTargetTimestamp = Math.round((interaction.createdTimestamp + endDelay) / 1000);
        } else {
            // timeCalc = Math.round((Date.now() - targetTimestamp) / 1000) * 1000;
            newTargetTimestamp = Math.round(targetTimestamp / 1000)
        }
        embed.setTitle(`Do you agree with ${intMember.displayName}'s decision to dispute this statement?`);
        embed.setDescription([`${intMember.displayName} thinks that ${message.member!.displayName} is full of shit.`,
            ``,
        Util.splitMessage(`> ${message.content} - ${message.author}`, { char: '', append: '...', maxLength: 250 })[0]!,
            ``,
        `Vote Ends: <t:${newTargetTimestamp}:R>`].join('\n'));
        embed.addField(`*Yes Votes: ${results.yes_votes}*`, (`${yes_string ? yes_string : 'None'}`), true);
        embed.addField(`*No Votes: ${results.no_votes}*`, (`${no_string ? no_string : 'None'}`), true);
        embed.setURL(message.url);
        return embed;
    }

    public static getFinalEmbed(interaction: Interaction, message: Message, results: DisputeResults): DisputeEmbed {
        const embed = new DisputeEmbed(interaction);
        if (results.successful_pct > 50) {
            embed.setTitle(`Turns out that ${message.member!.displayName} was full of shit.`);
            embed.setDescription([`This dispute succeeded with ${results.successful_pct_rounded}% agreeing.`,
                ``,
            Util.splitMessage(`> ${message.content} - ${message.author}`, { char: '', append: '...', maxLength: 250 })[0]!].join('\n'));
        } else {
            embed.setTitle(`Turns out that ${message.member!.displayName} was not full of shit.`);
            embed.setDescription([`This dispute failed with only ${results.successful_pct_rounded}% agreeing.`,
                ``,
            Util.splitMessage(`> ${message.content} - ${message.author}`, { char: '', append: '...', maxLength: 250 })[0]!].join('\n'));
        }
        embed.setURL(message.url);
        return embed;
    }

    public static getSelfUsedEmbed(interaction: Interaction): InteractionReplyOptions {
        const buffer = readFileSync(new URL(`../../../../../res/avatars/2-5.png`, import.meta.url));
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = new DisputeEmbed(interaction);
        embed.setThumbnail(attachment.getEmbedUrl());
        embed.setDescription(`You can't dispute yourself, you fucking idiot. How can you be so fucking stupid??`);
        return { embeds: [embed], files: [attachment], ephemeral: true };
    }

    public static getAlreadyDisputedEmbed(interaction: Interaction, results: DisputeResults): InteractionReplyOptions {
        const buffer = readFileSync(new URL(`../../../../../res/avatars/2-5.png`, import.meta.url));
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = new DisputeEmbed(interaction);
        embed.setThumbnail(attachment.getEmbedUrl());
        let helperText = `failed with only ${results.successful_pct_rounded}% agreeing.`
        if (results.successful_pct > 50) helperText = `suceeded with ${results.successful_pct_rounded}% agreeing that <@${results.dispute_user_id}> was full of shit.`
        embed.setDescription([`That message has already been disputed by <@${results.dispute_user_id}>, you fucking idiot. How can you be so fucking stupid??`,
            `\n`,
        `That dispute had ${results.total_votes} votes and ${helperText}`].join('\n'));
        return { embeds: [embed], files: [attachment], ephemeral: true };
    }

    public static getNotEnoughVotesEmbed(interaction: Interaction): InteractionReplyOptions {
        const buffer = readFileSync(new URL(`../../../../../res/avatars/2-5.png`, import.meta.url));
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = new DisputeEmbed(interaction);
        embed.setThumbnail(attachment.getEmbedUrl());
        embed.setDescription(`Not enough people voted. This dispute has been cancelled.`);
        return { embeds: [embed], components: [], files: [attachment] };
    }
}
