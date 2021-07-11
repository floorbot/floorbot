import { WeatherButton, WeatherButtonFunction } from '../WeatherButton';
import { LocationData } from '../../api/OpenWeatherApi';
import { User, Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class CurrentButton extends WeatherButton {

    constructor(location: LocationData, user?: User) {
        super(WeatherButtonFunction.CURRENT);
        this.setStyle(MessageButtonStyles.SUCCESS);
        this.setLabel('Current');
        this.setCustomId(Object.assign({
            cn: location.city_name,
            sc: location.state_code,
            cc: location.country_code
        }, (user ? { wl: user.id } : {})));
    }
}
