import { ModalBuilder } from 'discord.js';
import { FloorbotModalActionRowBuilder } from './FloorbotModalActionRowBuilder.js';

export enum FloorbotModalID {
    Feedback = 'feedback'
}

export class FloorbotModalBuilder {

    public static feedbackModal(): ModalBuilder {
        return new ModalBuilder()
            .setCustomId(FloorbotModalID.Feedback)
            .setTitle('Submit Feedback')
            .addComponents(
                new FloorbotModalActionRowBuilder().addFeedbackTitleTextInput(),
                new FloorbotModalActionRowBuilder().addFeedbackMessageTextInput()
            );
    }
}
