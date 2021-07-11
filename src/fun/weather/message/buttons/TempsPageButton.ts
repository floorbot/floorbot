import { WeatherButton, WeatherButtonFunction } from '../WeatherButton';
import { Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class TempsPageButton extends WeatherButton {

    constructor(currentPage: number, targetPage: number) {
        super(WeatherButtonFunction.TEMPS);
        this.setStyle(MessageButtonStyles.PRIMARY);
        this.setLabel(targetPage < currentPage ? `< Page ${targetPage}` : `Page ${targetPage} >`)
        this.setCustomId({ page: targetPage });
    }
}
