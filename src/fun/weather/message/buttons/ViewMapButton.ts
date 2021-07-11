import { OpenWeatherAPI, LatLonData } from '../../api/OpenWeatherAPI';
import { MessageButton, Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class ViewMapButton extends MessageButton {

    constructor(location: LatLonData) {
        super();
        this.setURL(OpenWeatherAPI.getGoogleMapsLink(location));
        this.setStyle(MessageButtonStyles.LINK);
        this.setLabel('View Map');
    }
}
