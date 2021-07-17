import { OpenWeatherAPI, GeocodeData, AirPollutionData } from '../../api/OpenWeatherAPI';
import { WeatherLinkSchema } from '../../WeatherDatabase';
import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from './WeatherEmbed';
import { Util } from 'discord.js';

export class AirPollutionEmbed extends WeatherEmbed {

    constructor(context: HandlerContext, geocode: GeocodeData | WeatherLinkSchema, airPollution: AirPollutionData) {
        super(context);

        const locationString = OpenWeatherAPI.getLocationString(geocode, true);
        const aqiString = this.getAQIString(airPollution.list[0].main.aqi);
        const localeEmoji = Util.localeToEmoji(geocode.country);

        this.setTitle(`${localeEmoji} Air Quality for ${locationString} (${aqiString})`);
        this.setURL(OpenWeatherAPI.getGoogleMapsLink(geocode));
        this.addField('Name', (
            `(CO) Carbon monoxide\n` +
            `(NO) Nitrogen monoxide\n` +
            `(NO₂) Nitrogen dioxide\n` +
            `(O₃) Ozone\n` +
            `(SO₂) Sulphur dioxide\n` +
            `(PM₂.₅) Fine particles matter\n` +
            `(PM₁₀) Coarse particulate matter\n` +
            `(NH₃) Ammonia\n`
        ), true);
        const components = airPollution.list[0].components;
        this.addField('Quantity', (
            `${WeatherEmbed.getQualityEmoji(context.client, this.getCO(components.co))} ${components.co} μg/m³\n` +
            `${WeatherEmbed.getQualityEmoji(context.client, this.getNO(components.no))} ${components.no} μg/m³\n` +
            `${WeatherEmbed.getQualityEmoji(context.client, this.getNO2(components.no2))} ${components.no2} μg/m³\n` +
            `${WeatherEmbed.getQualityEmoji(context.client, this.getO3(components.o3))} ${components.o3} μg/m³\n` +
            `${WeatherEmbed.getQualityEmoji(context.client, this.getSO2(components.so2))} ${components.so2} μg/m³\n` +
            `${WeatherEmbed.getQualityEmoji(context.client, this.getPM2_5(components.pm2_5))} ${components.pm2_5} μg/m³\n` +
            `${WeatherEmbed.getQualityEmoji(context.client, this.getPM10(components.pm10))} ${components.pm10} μg/m³\n` +
            `${WeatherEmbed.getQualityEmoji(context.client, this.getNH3(components.nh3))} ${components.nh3} μg/m³\n`
        ), true)
    }

    private getAQIString(aqi: number): string {
        switch (aqi) {
            case 1: { return 'Good' }
            case 2: { return 'Fair' }
            case 3: { return 'Moderate' }
            case 4: { return 'Poor' }
            case 5: { return 'Very Poor' }
            default: { return '*unknown*' }
        }
    }


    private getCO(co: number): number {
        if (co >= 5000) return 13;
        if (co >= 3600) return 12;
        if (co >= 2000) return 11;
        if (co >= 1200) return 10;
        if (co >= 800) return 9;
        if (co >= 600) return 8;
        if (co >= 475) return 7;
        if (co >= 375) return 6;
        if (co >= 300) return 5;
        if (co >= 250) return 4;
        if (co >= 210) return 3;
        if (co >= 175) return 2;
        return 1;
    }

    private getNO(no: number): number {
        if (no >= 150) return 13;
        if (no >= 100) return 12;
        if (no >= 75) return 11;
        if (no >= 50) return 10;
        if (no >= 25) return 9;
        if (no >= 15) return 8;
        if (no >= 10) return 7;
        if (no >= 5) return 6;
        if (no >= 3) return 5;
        if (no >= 1) return 4;
        if (no >= 0.5) return 3;
        if (no >= 0.01) return 2;
        return 1;
    }

    private getNO2(no2: number): number {
        if (no2 >= 300) return 13;
        if (no2 >= 200) return 12;
        if (no2 >= 150) return 11;
        if (no2 >= 100) return 10;
        if (no2 >= 75) return 9;
        if (no2 >= 50) return 8;
        if (no2 >= 25) return 7;
        if (no2 >= 10) return 6;
        if (no2 >= 5) return 5;
        if (no2 >= 2.5) return 4;
        if (no2 >= 1.25) return 3;
        if (no2 >= 0.5) return 2;
        return 1;
    }

    private getO3(o3: number): number {
        if (o3 >= 250) return 13;
        if (o3 >= 200) return 12;
        if (o3 >= 150) return 11;
        if (o3 >= 125) return 10;
        if (o3 >= 100) return 9;
        if (o3 >= 80) return 8;
        if (o3 >= 65) return 7;
        if (o3 >= 50) return 6;
        if (o3 >= 35) return 5;
        if (o3 >= 25) return 4;
        if (o3 >= 16) return 3;
        if (o3 >= 8) return 2;
        return 1;
    }

    private getSO2(so2: number): number {
        if (so2 >= 225) return 13;
        if (so2 >= 150) return 12;
        if (so2 >= 110) return 11;
        if (so2 >= 80) return 10;
        if (so2 >= 55) return 9;
        if (so2 >= 35) return 8;
        if (so2 >= 20) return 7;
        if (so2 >= 10) return 6;
        if (so2 >= 5) return 5;
        if (so2 >= 2.5) return 4;
        if (so2 >= 1) return 3;
        if (so2 >= 0.15) return 2;
        return 1;
    }

    private getPM2_5(pm2_5: number): number {
        if (pm2_5 >= 500) return 13;
        if (pm2_5 >= 300) return 12;
        if (pm2_5 >= 150) return 11;
        if (pm2_5 >= 100) return 10;
        if (pm2_5 >= 75) return 9;
        if (pm2_5 >= 50) return 8;
        if (pm2_5 >= 35) return 7;
        if (pm2_5 >= 20) return 6;
        if (pm2_5 >= 10) return 5;
        if (pm2_5 >= 5) return 4;
        if (pm2_5 >= 2.5) return 3;
        if (pm2_5 >= 1) return 2;
        return 1;
    }

    private getPM10(pm10: number): number {
        if (pm10 >= 1000) return 13;
        if (pm10 >= 600) return 12;
        if (pm10 >= 300) return 11;
        if (pm10 >= 150) return 10;
        if (pm10 >= 100) return 9;
        if (pm10 >= 75) return 8;
        if (pm10 >= 50) return 7;
        if (pm10 >= 25) return 6;
        if (pm10 >= 12.5) return 5;
        if (pm10 >= 6) return 4;
        if (pm10 >= 3) return 3;
        if (pm10 >= 1.25) return 2;
        return 1;
    }

    private getNH3(nh3: number): number {
        if (nh3 >= 150) return 13;
        if (nh3 >= 110) return 12;
        if (nh3 >= 80) return 11;
        if (nh3 >= 55) return 10;
        if (nh3 >= 35) return 9;
        if (nh3 >= 20) return 8;
        if (nh3 >= 10) return 7;
        if (nh3 >= 5) return 6;
        if (nh3 >= 2.5) return 5;
        if (nh3 >= 1) return 4;
        if (nh3 >= 0.5) return 3;
        if (nh3 >= 0.05) return 2;
        return 1;
    }
}
