import { WeatherComponentID, WeatherMessageActionRow, WeatherTempsOrder } from './WeatherActionRow.js.js';
import { LatLonData, OpenWeatherAPI, OpenWeatherData } from '../open_weather/OpenWeatherAPI.js';
import { ButtonBuilder } from '../../../lib/discord.js/builders/ButtonBuilder.js';
import { EmbedBuilder } from '../../../lib/discord.js/builders/EmbedBuilder.js';
import { ReplyBuilder } from '../../../lib/discord.js/builders/ReplyBuilder.js';
import { OneCallData } from '../open_weather/interfaces/OneCallData.js';
import { Pageable } from '../../../helpers/pageable/Pageable.js';
import WeatherLinkRow from '../tables/WeatherLinkTable.js';
import { Util } from '../../../helpers/Util.js';
import { GuildMember } from 'discord.js';
import { DateTime } from 'luxon';

export class WeatherReply extends ReplyBuilder {

    protected createWeatherEmbedBuilder(pageable?: Pageable<OneCallData>): EmbedBuilder {
        const embed = super.createEmbedBuilder();
        const iconURL = 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg';
        if (pageable) embed.setFooter({ text: `${pageable.currentPage}/${pageable.totalPages} - Powered by Urban Dictionary`, iconURL });
        else embed.setFooter({ text: `Powered by Urban Dictionary`, iconURL });
        return embed;
    }

    public static formatTimezone(timezone: string): string {
        const date = DateTime.now().setZone(timezone);
        return date.toLocaleString({
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h12'
        });
    }

    public addWeatherPageActionRow(pageData: WeatherViewData): this {
        if (pageData.page == 0 && pageData.totalPages == 1) return this;
        const actionRow = new PageableButtonActionRowBuilder();
        actionRow.addPreviousPageButton(undefined, pageData.totalPages == 1);
        actionRow.addNextPageButton(undefined, pageData.totalPages == 1);
        return this.addActionRow(actionRow);
    }

    public addWeatherActionRow(components: WeatherComponentID[], location: LatLonData): this {
        const actionRow = new WeatherMessageActionRow();
        components.forEach((component) => { actionRow.addWeatherButton(component); });
        actionRow.addComponents(ButtonBuilder.viewOnlineButton(OpenWeatherAPI.getGoogleMapsLink(location)));
        return this.addComponents(actionRow);
    }

    public addWeatherServerTempsEmbed(links: [OneCallData, GuildMember, WeatherLinkRow][], viewData: WeatherViewData): this {
        if (viewData.order === WeatherTempsOrder.Hottest) links.sort((link1, link2) => { return link2[0].current.temp - link1[0].current.temp; });
        else if (viewData.order === WeatherTempsOrder.Coldest) links.sort((link1, link2) => { return link1[0].current.temp - link2[0].current.temp; });
        else if (viewData.order === WeatherTempsOrder.Hottest) links.sort((link1, link2) => { return link2[0].current.humidity - link1[0].current.humidity; });
        else if (viewData.order === WeatherTempsOrder.Timezone) links.sort((link1, link2) => { return link2[0].timezone_offset - link1[0].timezone_offset; });
        const sliced = links.slice((viewData.page) * viewData.perPage, viewData.page + 1 * viewData.perPage);
        if (!sliced.length && viewData.page !== 0) return this.addWeatherServerTempsEmbed(links, { ...viewData, page: 0 });
        const embed = viewData.totalPages > 1 ? this.createEmbedBuilder(viewData) : this.createEmbedBuilder();
        embed.setAuthor({ name: `Temps for ${(<any>this.context!).guild!.name}`, iconURL: (<any>this.context!).guild!.iconURL()! });
        embed.setDescription(sliced.map(([weather, member, link]) => {
            const timeString = WeatherReply.formatTimezone(weather.timezone);
            const localeEmoji = Util.localeToEmoji(link.country);
            const weatherEmoji = WeatherEmojis.getWeatherEmoji((<any>this.context!).client, weather.current.weather[0].icon);
            const tempString = `${weather.current.temp.toFixed(2)}°C`.padEnd(8); // -99.99°C
            const tempStringF = `(${Util.toFahrenheit(weather.current.temp)}°F)`.padEnd(7); // 999°F
            const humidityString = `${weather.current.humidity}%`.padEnd(3);
            return `${localeEmoji} \`${timeString}\` ${weatherEmoji} \`${tempString} ${tempStringF} ${humidityString}\` ${member}`;
        }));
        return this.addEmbeds(embed);
    }

    public addWeatherCurrentEmbed(weather: OpenWeatherData): this {
        const embed = this.createEmbedBuilder();
        const locationString: string = OpenWeatherAPI.getLocationString(weather, true);
        const dateString = WeatherReply.formatTimezone(weather.timezone);
        const localeEmoji = Util.localeToEmoji(weather.country);
        embed.setURL(OpenWeatherAPI.getGoogleMapsLink(weather));
        embed.setTitle(`${localeEmoji} Weather for ${locationString} (${dateString})`);
        embed.setThumbnail(`http://openweathermap.org/img/wn/${weather.current.weather[0].icon}@2x.png`);
        embed.addField({
            name: `**Temperature**`, value: (
                `Current: **${weather.current.temp.toFixed(1)}°C** (**${HandlerUtil.toFahrenheit(weather.current.temp)}°F**)\n` +
                `Min: **${weather.daily[0]!.temp.min.toFixed(1)}°C** (**${HandlerUtil.toFahrenheit(weather.daily[0]!.temp.min)}°F**)\n` +
                `Max: **${weather.daily[0]!.temp.max.toFixed(1)}°C** (**${HandlerUtil.toFahrenheit(weather.daily[0]!.temp.max)}°F**)\n` +
                `Dew Point: **${weather.current.dew_point.toFixed(1)}°C** (**${HandlerUtil.toFahrenheit(weather.current.dew_point)}°F**)\n` +
                `Humidity: **${weather.current.humidity}%**\n` +
                `Pressure: **${HandlerUtil.formatCommas(weather.current.pressure)}hPa**`
            ),
            inline: true
        });
        embed.addField({
            name: `**Weather**`, value: (
                `**${HandlerUtil.capitalizeString(weather.current.weather[0].description)}**\n` +
                `Clouds: **${weather.current.clouds}%**\n` +
                `Wind Speed: **${weather.current.wind_speed}km/h**\n` +
                `Wind Deg: **${weather.current.wind_deg}°**\n` +
                `Visibility: **${HandlerUtil.formatCommas(weather.current.visibility)}m**\n` +
                `UV Index: **${weather.current.uvi}**`
            ), inline: true
        });
        return this.addEmbed(embed);
    }

    public addWeatherForecastEmbed(weather: OpenWeatherData): this {
        const embed = this.createEmbedBuilder();
        const locationString: string = OpenWeatherAPI.getLocationString(weather, true);
        const timeString = WeatherReply.formatTimezone(weather.timezone);
        const localeEmoji = HandlerUtil.localeToEmoji(weather.country);
        embed.setTitle(`${localeEmoji} Forecast for ${locationString}`);
        embed.setURL(OpenWeatherAPI.getGoogleMapsLink(weather));
        embed.setDescription(
            `Date/Time: **${timeString}**\n` +
            (weather.current.sunrise && weather.current.sunset ?
                `Sunrise/Sunset: **<t:${weather.current.sunrise}:t> - <t:${weather.current.sunset}:t>**\n` :
                `Sunrise/Sunset: ***unknown***\n`
            ) +
            `Lat/Lon: **${weather.lat}, ${weather.lon}**\n`
        );
        weather.daily.slice(0, 6).forEach(day => {
            const emoji = WeatherEmojis.getWeatherEmoji((<any>this.context!).client, day.weather[0].icon);
            embed.addField({
                name: `<t:${day.dt}:D>`, value: (
                    `**${HandlerUtil.capitalizeString(day.weather[0].description)}** ${emoji}\n` +
                    `Min: **${day.temp.min}°C** (**${HandlerUtil.toFahrenheit(day.temp.min)}°F**)\n` +
                    `Max: **${day.temp.max}°C** (**${HandlerUtil.toFahrenheit(day.temp.max)}°F**)\n` +
                    `Humidity: **${day.humidity}%**\n`
                ),
                inline: true
            });
        });
        return this.addEmbed(embed);
    }

    public addWeatherAirPollutionEmbed(weather: OpenWeatherData): this {
        const embed = this.createEmbedBuilder();
        const locationString = OpenWeatherAPI.getLocationString(weather, true);
        const aqiString = this.getAQIString(weather.list[0]!.main.aqi);
        const localeEmoji = HandlerUtil.localeToEmoji(weather.country);
        embed.setTitle(`${localeEmoji} Air Quality for ${locationString} (${aqiString})`);
        embed.setURL(OpenWeatherAPI.getGoogleMapsLink(weather));
        embed.addField({
            name: 'Name', value: (
                `(CO) Carbon monoxide\n` +
                `(NO) Nitrogen monoxide\n` +
                `(NO₂) Nitrogen dioxide\n` +
                `(O₃) Ozone\n` +
                `(SO₂) Sulphur dioxide\n` +
                `(PM₂.₅) Fine particles matter\n` +
                `(PM₁₀) Coarse particulate matter\n` +
                `(NH₃) Ammonia\n`
            ),
            inline: true
        });
        const components = weather.list[0]!.components;
        embed.addField({
            name: 'Quantity', value: (
                `${WeatherEmojis.getQualityEmoji((<any>this.context!).client, this.getCO(components.co))} ${components.co} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji((<any>this.context!).client, this.getNO(components.no))} ${components.no} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji((<any>this.context!).client, this.getNO2(components.no2))} ${components.no2} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji((<any>this.context!).client, this.getO3(components.o3))} ${components.o3} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji((<any>this.context!).client, this.getSO2(components.so2))} ${components.so2} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji((<any>this.context!).client, this.getPM2_5(components.pm2_5))} ${components.pm2_5} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji((<any>this.context!).client, this.getPM10(components.pm10))} ${components.pm10} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji((<any>this.context!).client, this.getNH3(components.nh3))} ${components.nh3} μg/m³\n`
            ),
            inline: true
        });
        return this.addEmbed(embed);
    }

    public addWeatherAlertEmbed(weather: OpenWeatherData): this {
        const embed = this.createEmbedBuilder();
        const locationString: string = OpenWeatherAPI.getLocationString(weather, true);
        const timeString = WeatherReplyBuilder.formatTimezone(weather.timezone);
        const localeEmoji = HandlerUtil.localeToEmoji(weather.country);
        embed.setURL(OpenWeatherAPI.getGoogleMapsLink(weather));
        if (weather.alerts && weather.alerts.length) {
            const alert = weather.alerts[0]!;
            embed.setTitle(`${localeEmoji} ${alert.event} Warning for ${locationString} (${timeString})`);
            embed.setDescription(Util.splitMessage([
                `Source: **${alert.sender_name}**`,
                `Start Time: **<t:${alert.start}:t>**`,
                `End Time: **<t:${alert.end}:t>**`,
                'Description:',
                alert.description
            ].join('\n'), {
                append: '...',
                char: '',
                maxLength: 4096
            })[0]!);
        } else {
            embed.setTitle(`No Weather Warning for ${locationString} (${timeString})`);
            embed.setDescription(`It looks like there is no active weather warning for \`${locationString}\`! Stay safe!`);
        }
        return this.addEmbed(embed);
    }
}
