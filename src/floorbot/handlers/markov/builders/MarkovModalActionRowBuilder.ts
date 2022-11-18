import { ActionRowBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { MarkovSettingsRow, MarkovSettingsTable } from '../tables/MarkovSettingsTable.js';

export enum MarkovTextInputId {
    Messages = 'messages',
    Minutes = 'minutes',
    ConfirmMessage = 'confirm_message',
}

export class MarkovModalActionRowBuilder extends ActionRowBuilder<ModalActionRowComponentBuilder> {
    public addConfirmMessageTextInput({ messageCheck }: { messageCheck: string; }): this {
        const textInput = new TextInputBuilder()
            .setLabel('Are you sure you want to delete markov data?')
            .setStyle(TextInputStyle.Short)
            .setCustomId(MarkovTextInputId.ConfirmMessage)
            .setMinLength(0)
            .setMaxLength(1024)
            .setPlaceholder(`Please type "${messageCheck}" to confirm`)
            .setRequired(false);
        return this.addComponents(textInput);
    }

    public addMessagesTextInput({ settings }: { settings: MarkovSettingsRow; }): this {
        const textInput = new TextInputBuilder()
            .setLabel('Messages to Markov Ratio')
            .setStyle(TextInputStyle.Short)
            .setCustomId(MarkovTextInputId.Messages)
            .setMinLength(0)
            .setMaxLength(1024)
            .setPlaceholder(`Channel messages per markov message (default ${MarkovSettingsTable.DEFAULT_MESSAGES})`)
            .setRequired(false);
        if (settings.messages !== MarkovSettingsTable.DEFAULT_MESSAGES) textInput.setValue(settings.messages.toString());
        return this.addComponents(textInput);
    }

    public addMinutesTextInput({ settings }: { settings: MarkovSettingsRow; }): this {
        const textInput = new TextInputBuilder()
            .setLabel('Minutes to Markov Ratio')
            .setStyle(TextInputStyle.Short)
            .setCustomId(MarkovTextInputId.Minutes)
            .setMinLength(1)
            .setMaxLength(1024)
            .setPlaceholder(`Minutes between markov messages (default ${MarkovSettingsTable.DEFAULT_MINUTES})`)
            .setRequired(false);
        if (settings.minutes !== MarkovSettingsTable.DEFAULT_MINUTES) textInput.setValue(settings.minutes.toString());
        return this.addComponents(textInput);
    }
}
