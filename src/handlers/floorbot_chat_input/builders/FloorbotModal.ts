import { ModalBuilderData } from '../../../lib/discord.js/builders/ModalBuilder.js';
import { FloorbotModalActionRow } from './FloorbotActionRow.js';
import { ModalBuilder } from 'discord.js';

export enum FloorbotModalID {
    Feedback = 'feedback'
}

export class FloorbotModal {

    public static feedbackModal(data?: ModalBuilderData): ModalBuilder {
        return new ModalBuilder(data)
            .setCustomId(FloorbotModalID.Feedback)
            .setTitle('Submit Feedback')
            .addComponents(
                new FloorbotModalActionRow().addFeedbackTitleTextInput(),
                new FloorbotModalActionRow().addFeedbackMessageTextInput()
            );
    }
}
