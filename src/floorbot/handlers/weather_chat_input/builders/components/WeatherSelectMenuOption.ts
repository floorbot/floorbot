import { SelectMenuOptionBuilder } from 'discord.js';

export enum WeatherSelectMenuOptionValue {
    Timezone = 'timezone',
    Humidity = 'humidity',
    Hottest = 'hottest',
    Coldest = 'coldest'
}

export class WeatherSelectMenuOption extends SelectMenuOptionBuilder {

    public override setDefault(isDefault?: boolean | WeatherSelectMenuOptionValue): this {
        if (typeof isDefault === 'string') return super.setDefault(this.data.value === isDefault);
        return super.setDefault(isDefault === true);
    }

    public static timezone(): WeatherSelectMenuOption {
        return new WeatherSelectMenuOption()
            .setValue(WeatherSelectMenuOptionValue.Timezone)
            .setLabel(`Order by Timezone`);
    }

    public static humidity(): WeatherSelectMenuOption {
        return new WeatherSelectMenuOption()
            .setValue(WeatherSelectMenuOptionValue.Humidity)
            .setLabel(`Order by Humidity`);
    }

    public static hottest(): WeatherSelectMenuOption {
        return new WeatherSelectMenuOption()
            .setValue(WeatherSelectMenuOptionValue.Hottest)
            .setLabel(`Order by Hottest`);
    }

    public static coldest(): WeatherSelectMenuOption {
        return new WeatherSelectMenuOption()
            .setValue(WeatherSelectMenuOptionValue.Coldest)
            .setLabel(`Order by Coldest`);
    }
}
