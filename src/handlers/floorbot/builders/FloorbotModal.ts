import { FloorbotModalActionRow } from './FloorbotActionRow.js';
import { ModalBuilder } from 'discord.js';

export enum FloorbotModalID {
    Feedback = 'feedback'
}

export class FloorbotModal {

    public static feedbackModal(): ModalBuilder {
        return new ModalBuilder()
            .setCustomId(FloorbotModalID.Feedback)
            .setTitle('Submit Feedback')
            .addComponents(
                new FloorbotModalActionRow().addFeedbackTitleTextInput(),
                new FloorbotModalActionRow().addFeedbackMessageTextInput()
            );
    }
}
