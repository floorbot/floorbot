import { ModalBuilderData } from '../../../lib/types/builder-data-types.js';
import { FloorbotComponent } from './FloorbotComponent.js';
import { ModalBuilder } from 'discord.js';

export enum FloorbotModalID {
    Feedback = 'feedback'
}

export class FloorbotModal {

    public static feedbackModal(data?: ModalBuilderData): ModalBuilder {
        return new ModalBuilder(data)
            .setCustomId(FloorbotModalID.Feedback)
            .setTitle('Submit Feedback')
            .addActionRow(FloorbotComponent.feedbackTitleTextInput())
            .addActionRow(FloorbotComponent.feedbackMessageTextInput());
    }
}
