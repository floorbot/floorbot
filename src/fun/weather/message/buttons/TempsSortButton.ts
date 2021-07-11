import { WeatherButton, WeatherButtonFunction } from '../WeatherButton';
import { TempsEmbedOrder } from '../embeds/TempsEmbed';
import { Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class TempsSortButton extends WeatherButton {

    constructor(order: TempsEmbedOrder) {
        super(WeatherButtonFunction.TEMPS);
        this.setStyle(MessageButtonStyles.SUCCESS);
        this.setLabel(`Sort ${order}`)
        this.setCustomId({ sort: order });
    }
}
