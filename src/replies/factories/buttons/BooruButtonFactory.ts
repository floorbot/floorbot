import { ButtonBuilder } from "../../builders/ButtonBuilder";
import { ButtonFactory, ButtonID } from "../ButtonFactory";
import { Constants } from "discord.js";

const { MessageButtonStyles } = Constants;

export const BooruButtonID = {
    ...ButtonID, ...{
        REPEAT: 'repeat',
        RECYCLE: 'recycle'
    }
};

export class BooruButtonFactory extends ButtonFactory {

    public createRecycleButton(): ButtonBuilder {
        return new ButtonBuilder()
            .setLabel('♻️')
            .setStyle(MessageButtonStyles.SUCCESS)
            .setCustomId(BooruButtonID.RECYCLE);
    }

    public createRepeatButton(tags?: string): ButtonBuilder {
        return new ButtonBuilder()
            .setLabel(tags ? 'Search Again' : 'Random Again')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(BooruButtonID.REPEAT);
    }
}