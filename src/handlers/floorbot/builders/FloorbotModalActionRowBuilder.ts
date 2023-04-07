import { ActionRowBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export enum FloorbotModalActionRowId {
    FeedbackTitle = 'feedback_title',
    FeedbackMessage = 'feedback_message'
}

export class FloorbotModalActionRowBuilder extends ActionRowBuilder<ModalActionRowComponentBuilder> {

    public addFeedbackTitleTextInput(): this {
        const textInput = new TextInputBuilder()
            .setLabel('Title')
            .setStyle(TextInputStyle.Short)
            .setCustomId(FloorbotModalActionRowId.FeedbackTitle)
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
            .setCustomId(FloorbotModalActionRowId.FeedbackMessage)
            .setMinLength(1)
            .setMaxLength(1024)
            .setPlaceholder('Please enter your feedback in detail')
            .setRequired(true);
        return this.addComponents(textInput);
    }
}
