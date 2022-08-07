
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { HandlerContext } from 'discord.js-handlers';

export enum FloorbotComponentID {
    Ping = 'ping',
    GuildStats = 'guild_stats',
    Feedback = 'feedback',
    FeedbackTitle = 'feedback_title',
    FeedbackMessage = 'feedback_message'
}

export class FloorbotMessageActionRow extends ActionRowBuilder<MessageActionRowComponentBuilder>{

    public addInviteButton(inviteURL: string): this {
        const button = new ButtonBuilder()
            .setLabel('Invite Link')
            .setStyle(ButtonStyle.Link)
            .setURL(inviteURL);
        return this.addComponents(button);
    }

    public addPingButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Ping')
            .setStyle(ButtonStyle.Success)
            .setCustomId(FloorbotComponentID.Ping);
        return this.addComponents(button);
    }

    public addGuildStatsButton(context: HandlerContext): this {
        const button = new ButtonBuilder()
            .setLabel('Guild Stats')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!context.inGuild())
            .setCustomId(FloorbotComponentID.GuildStats);
        return this.addComponents(button);
    }

    public addFeedbackButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Feedback')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(FloorbotComponentID.Feedback);
        return this.addComponents(button);
    }
}

export class FloorbotModalActionRow extends ActionRowBuilder<ModalActionRowComponentBuilder> {

    public addFeedbackTitleTextInput(): this {
        const textInput = new TextInputBuilder()
            .setLabel('Title')
            .setStyle(TextInputStyle.Short)
            .setCustomId(FloorbotComponentID.FeedbackTitle)
            .setMinLength(1)
            .setMaxLength(128)
            .setPlaceholder('Please enter a short title')
            .setRequired(true);
        return this.addComponents(textInput);
    }

    public addFeedbackMessageTextInput(): this {
        const textInput = new TextInputBuilder()
            .setLabel('Message')
            .setStyle(TextInputStyle.Paragraph)
            .setCustomId(FloorbotComponentID.FeedbackMessage)
            .setMinLength(1)
            .setMaxLength(1024)
            .setPlaceholder('Please enter your feedback in detail')
            .setRequired(true);
        return this.addComponents(textInput);
    }
}
