import { Message, MessageEmbed, MessageEmbedOptions, Interaction, InteractionReplyOptions, GuildMember } from 'discord.js';
import { HandlerEmbed } from '../../../../discord/components/HandlerEmbed.js';
import { HandlerAttachment } from '../../../../discord/components/HandlerAttachment.js';
import { DisputeResults } from '../DisputeDatabase.js'
import { readFileSync } from 'fs';

export class DisputeEmbed extends HandlerEmbed {

    constructor(interaction: Interaction, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(interaction);
    }

    public static getCurrentEmbed(interaction: Interaction, message: Message, results: DisputeResults): DisputeEmbed {
        const embed = new DisputeEmbed(interaction);
        const intMember = interaction.member! as GuildMember
        embed.setAuthor([`${intMember.displayName} thinks that ${message.member!.displayName} is full of shit.`,
                         `Do you believe ${message.member!.displayName} is correct?`
                        ].join('\n'));
        embed.setDescription(message.content + ' -' + `${message.author}`);
        embed.addField(`*Yes Votes*`, (`${results.yes_votes}`), true);
        embed.addField(`*No Votes*`, (`${results.no_votes}`), true);
        return embed;
    }

    public static getFinalEmbed(interaction: Interaction, message: Message, results: DisputeResults): DisputeEmbed {
        const embed = new DisputeEmbed(interaction);
        if (results.successful_pct > 50) {
          embed.setAuthor([`Turns out that ${message.member!.displayName} was full of shit.`,
                           `This dispute successed with ${results.successful_pct_rounded}% agreeing.`
                          ].join('\n'));
          embed.setDescription(message.content + ' -' + `${message.author}`);
        } else {
          embed.setAuthor([`Turns out that ${message.member!.displayName} was not full of shit.`,
                           `This dispute failed with only ${results.successful_pct_rounded}% agreeing.`
                          ].join('\n'));
          embed.setDescription(message.content + ' -' + `${message.author}`);
        }
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
}
