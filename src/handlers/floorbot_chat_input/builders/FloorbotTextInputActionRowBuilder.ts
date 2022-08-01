import { TextInputActionRowBuilder } from '../../../lib/builders/TextInputActionRowBuilder.js';
import { TextInputBuilder } from '../../../lib/builders/TextInputBuilder.js';
import { TextInputStyle } from 'discord.js';

export enum FloorbotTextInputComponentID {
    FeedbackTitle = 'feedback_title',
    FeedbackMessage = 'feedback_message'
}

export class FloorbotTextInputActionRowBuilder extends TextInputActionRowBuilder {

    public addFeedbackTitleTextInput() {
        const textInput = new TextInputBuilder()
            .setLabel('Title')
            .setStyle(TextInputStyle.Short)
            .setCustomId(FloorbotTextInputComponentID.FeedbackTitle)
            .setMinLength(1)
            .setMaxLength(128)
            .setPlaceholder('Please enter a short title')
            .setRequired(true);
        return this.addComponents(textInput);
    }

    public addFeedbackMessageTextInput() {
        const textInput = new TextInputBuilder()
            .setLabel('Message')
            .setStyle(TextInputStyle.Paragraph)
            .setCustomId(FloorbotTextInputComponentID.FeedbackMessage)
            .setMinLength(1)
            .setMaxLength(1024)
            .setPlaceholder('Please enter your feedback in detail')
            .setRequired(true);
        return this.addComponents(textInput);
    }
}
