import { WeatherButton, WeatherButtonFunction } from '../WeatherButton';
import { LocationData } from '../../api/OpenWeatherApi';
import { User, Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class AirQualityButton extends WeatherButton {

    constructor(location: LocationData, user?: User) {
        super(WeatherButtonFunction.AIR_QUALITY);
        this.setStyle(MessageButtonStyles.SUCCESS);
        this.setLabel('Air Quality');
        this.setCustomId(Object.assign({
            cn: location.city_name,
            sc: location.state_code,
            cc: location.country_code
        }, (user ? { wl: user.id } : {})));
    }
}
