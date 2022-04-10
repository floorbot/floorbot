import { ButtonComponentID } from '../../../lib/discord/builders/ButtonActionRowBuilder.js';
import { ComponentType, ModalData, TextInputStyle } from 'discord.js';

export enum BooruHeartModalComponentID {
    Notes = 'notes'
}

export const BooruHeartModalData: ModalData = {
    title: 'Save this booru',
    customId: ButtonComponentID.Heart,
    components: [{
        type: ComponentType.ActionRow,
        components: [{
            type: ComponentType.TextInput,
            customId: BooruHeartModalComponentID.Notes,
            label: 'Add a note',
            style: TextInputStyle.Paragraph,
            minLength: 0,
            maxLength: 1024,
            placeholder: 'View saved boorus and notes with "/saved boorus"',
            required: false
        }]
    }]
};
