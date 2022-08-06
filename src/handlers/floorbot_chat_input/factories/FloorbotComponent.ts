
import { ButtonBuilderData, TextInputBuilderData } from '../../../lib/types/builder-data-types.js';
import { ButtonBuilder, ButtonStyle, TextInputBuilder, TextInputStyle } from "discord.js";

export enum FloorbotComponentID {
    Ping = 'ping',
    GuildStats = 'guild_stats',
    Feedback = 'feedback',
    FeedbackTitle = 'feedback_title',
    FeedbackMessage = 'feedback_message'
}

export class FloorbotComponent {

    public static inviteButton(data: ButtonBuilderData & { inviteURL: string; }): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('Invite Link')
            .setStyle(ButtonStyle.Link)
            .setURL(data.inviteURL);
    }

    public static pingButton(data?: ButtonBuilderData): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('Ping')
            .setStyle(ButtonStyle.Success)
            .setCustomId(FloorbotComponentID.Ping);
    }

    public static guildStatsButton(data?: ButtonBuilderData): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('Guild Stats')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(FloorbotComponentID.GuildStats);
    }

    public static feedbackButton(data?: ButtonBuilderData): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('Feedback')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(FloorbotComponentID.Feedback);
    }

    public static feedbackTitleTextInput(data?: TextInputBuilderData): TextInputBuilder {
        return new TextInputBuilder(data)
            .setLabel('Title')
            .setStyle(TextInputStyle.Short)
            .setCustomId(FloorbotComponentID.FeedbackTitle)
            .setMinLength(1)
            .setMaxLength(128)
            .setPlaceholder('Please enter a short title')
            .setRequired(true);
    }

    public static feedbackMessageTextInput(data?: TextInputBuilderData): TextInputBuilder {
        return new TextInputBuilder(data)
            .setLabel('Message')
            .setStyle(TextInputStyle.Paragraph)
            .setCustomId(FloorbotComponentID.FeedbackMessage)
            .setMinLength(1)
            .setMaxLength(1024)
            .setPlaceholder('Please enter your feedback in detail')
            .setRequired(true);
    }
}
