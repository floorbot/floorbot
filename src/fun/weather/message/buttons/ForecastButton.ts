import { WeatherButton, WeatherButtonFunction } from '../WeatherButton';
import { LocationData } from '../../api/OpenWeatherAPI';
import { User, Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class ForecastButton extends WeatherButton {

    constructor(location: LocationData, user?: User) {
        super(WeatherButtonFunction.FORECAST);
        this.setStyle(MessageButtonStyles.SUCCESS);
        this.setLabel('Forecast');
        this.setCustomId(Object.assign({
            cn: location.city_name,
            sc: location.state_code,
            cc: location.country_code
        }, (user ? { wl: user.id } : {})));
    }
}
