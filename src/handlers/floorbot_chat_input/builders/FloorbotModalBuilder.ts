import { FloorbotTextInputActionRowBuilder } from './FloorbotTextInputActionRowBuilder.js';
import { ModalBuilder } from '../../../lib/builders/ModalBuilder.js';

export class FloorbotModalBuilder extends ModalBuilder {

    public addFeedbackTextInputActionRows(): this {
        const titleActionRow = new FloorbotTextInputActionRowBuilder()
            .addFeedbackTitleTextInput();
        const messageActionRow = new FloorbotTextInputActionRowBuilder()
            .addFeedbackMessageTextInput();
        return this.addComponents(titleActionRow, messageActionRow);
    }
}
