import { GeocodeData, LatLonData, LocationQuery, OneCallData, OpenWeatherAPI, WeatherAPIError } from "../../lib/apis/open-weather/OpenWeatherAPI.js";
import { SelectMenuBuilder } from "../../lib/discord/builders/SelectMenuBuilder.js";
import { PageableActionRowBuilder } from "../../helpers/mixins/PageableMixins.js";
import { ActionRowBuilder } from "../../lib/discord/builders/ActionRowBuilder.js";
import { ButtonBuilder } from "../../lib/discord/builders/ButtonBuilder.js";
import { EmbedBuilder } from "../../lib/discord/builders/EmbedBuilder.js";
import { ReplyBuilder } from "../../lib/discord/builders/ReplyBuilder.js";
import { MixinConstructor } from "../../lib/ts-mixin-extended.js";
import { OpenWeatherData } from "./WeatherChatInputHandler.js";
import { HandlerUtil } from "../../lib/discord/HandlerUtil.js";
import { MessageButtonStyles } from "discord.js/typings/enums";
import { GuildChannel, GuildMember, Util } from "discord.js";
import { WeatherEmojis } from "./WeatherEmojis.js";
import WeatherLinkRow from "./WeatherLinkTable.js";
import { DateTime } from "luxon";

export class WeatherReplyBuilder extends WeatherReplyMixin(ReplyBuilder) { };

export function WeatherReplyMixin<T extends MixinConstructor<ReplyBuilder>>(Builder: T) {
    return class WeatherReplyBuilder extends Builder {

        // protected createWeatherEmbedBuilder(pageable?: Pageable<Weather>): EmbedBuilder {
        //     const embed = super.createEmbedBuilder();
        //     const iconURL = 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg';
        //     if (pageable) {
        //         embed.setFooter(`${pageable.currentPage}/${pageable.totalPages} - Powered by Urban Dictionary`, iconURL);
        //     } else {
        //         embed.setFooter(`Powered by Urban Dictionary`, iconURL);
        //     }
        //     return embed;
        // }

        protected override createEmbedBuilder(viewData?: WeatherViewData): EmbedBuilder {
            const embed = super.createEmbedBuilder();
            const iconURL = 'https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png';
            if (viewData) {
                embed.setFooter(`${viewData.page + 1}/${viewData.totalPages} - Powered by OpenWeatherMap`, iconURL);
            } else {
                embed.setFooter(`Powered by OpenWeatherMap`, iconURL);
            }
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

        public addWeatherLoadingEmbed(total: number, current: number): this {
            const progressBar = new Array(11).fill('▬');
            progressBar[Math.floor(current / total * 10)] = '🟢';
            const embed = this.createEmbedBuilder()
                .setTitle(`Loading Weather!`)
                .setDescription(`Progress: ${progressBar.join('')} [${Math.round(current / total * 100)}%] ${current}/${total}`);
            return this.addEmbed(embed);
        }

        public addWeatherUnknownLocationEmbed(location: LocationQuery): this {
            const embed = this.createEmbedBuilder()
                .setDescription(`Sorry! I could not find \`${OpenWeatherAPI.getLocationString(location, true)}\`\n*Please check the spelling or try another nearby location*`);
            return this.addEmbed(embed);
        }

        public addWeatherMissingAdminEmbed(): this {
            const embed = this.createEmbedBuilder()
                .setDescription(`Sorry! you must be an admin to force link or unlink locations from other people!`);
            return this.addEmbed(embed);
        }

        public addWeatherMissingParamsEmbed(member: GuildMember): this {
            const embed = this.createEmbedBuilder()
                .setDescription(`Sorry! I do not have a saved location for ${member}. Please use \`/weather link\` to set one!`);
            return this.addEmbed(embed);
        }

        public addWeatherAPIErrorEmbed(error: WeatherAPIError): this {
            const embed = this.createEmbedBuilder()
                .setDescription([
                    `Sorry I seem to have an API issue:`,
                    `*${error.message}*`
                ].join('\n'));
            return this.addEmbed(embed);
        }

        public addWeatherNoLinkedMembersEmbed(channel: GuildChannel): this {
            const embed = this.createEmbedBuilder()
                .setDescription([
                    `There are no members with saved locations in ${channel}`,
                    'Please use \`/weather link\` to start the weather leaderboard!'
                ].join('\n'));
            return this.addEmbed(embed);
        }

        public addWeatherLinkedEmbed(geocode: GeocodeData, member: GuildMember): this {
            const embed = this.createEmbedBuilder()
                .setDescription(`Successfully linked location \`${OpenWeatherAPI.getLocationString(geocode, true)}\` to ${member} 🥳`);
            return this.addEmbed(embed);
        }

        public addWeatherUnlinkedEmbed(member: GuildMember): this {
            const embed = this.createEmbedBuilder()
                .setDescription(`Successfully unlinked any saved location from ${member} 🤠`);
            return this.addEmbed(embed);
        }

        public addWeatherServerTempsEmbed(links: [OneCallData, GuildMember, WeatherLinkRow][], viewData: WeatherViewData): this {
            if (viewData.order === WeatherTempsOrder.HOTTEST) links.sort((link1, link2) => { return link2[0].current.temp - link1[0].current.temp; });
            else if (viewData.order === WeatherTempsOrder.COLDEST) links.sort((link1, link2) => { return link1[0].current.temp - link2[0].current.temp; });
            else if (viewData.order === WeatherTempsOrder.HUMIDITY) links.sort((link1, link2) => { return link2[0].current.humidity - link1[0].current.humidity; });
            else if (viewData.order === WeatherTempsOrder.TIMEZONE) links.sort((link1, link2) => { return link2[0].timezone_offset - link1[0].timezone_offset; });
            const sliced = links.slice((viewData.page) * viewData.perPage, viewData.page + 1 * viewData.perPage);
            if (!sliced.length && viewData.page !== 0) return this.addWeatherServerTempsEmbed(links, { ...viewData, page: 0 });
            const embed = viewData.totalPages > 1 ? this.createEmbedBuilder(viewData) : this.createEmbedBuilder();
            embed.setAuthor(`Temps for ${this.context!.guild!.name}`, this.context!.guild!.iconURL()!);
            embed.setDescription(sliced.map(([weather, member, link]) => {
                const timeString = WeatherReplyBuilder.formatTimezone(weather.timezone);
                const localeEmoji = HandlerUtil.localeToEmoji(link.country);
                const weatherEmoji = WeatherEmojis.getWeatherEmoji(this.context!.client, weather.current.weather[0].icon);
                const tempString = `${weather.current.temp.toFixed(2)}°C`.padEnd(8); // -99.99°C
                const tempStringF = `(${HandlerUtil.toFahrenheit(weather.current.temp)}°F)`.padEnd(7); // 999°F
                const humidityString = `${weather.current.humidity}%`.padEnd(3);
                return `${localeEmoji} \`${timeString}\` ${weatherEmoji} \`${tempString} ${tempStringF} ${humidityString}\` ${member}`;
            }));
            return this.addEmbed(embed);
        }

        public addWeatherCurrentEmbed(weather: OpenWeatherData): this {
            const embed = this.createEmbedBuilder();
            const locationString: string = OpenWeatherAPI.getLocationString(weather, true);
            const dateString = WeatherReplyBuilder.formatTimezone(weather.timezone);
            const localeEmoji = HandlerUtil.localeToEmoji(weather.country);
            embed.setURL(OpenWeatherAPI.getGoogleMapsLink(weather));
            embed.setTitle(`${localeEmoji} Weather for ${locationString} (${dateString})`);
            embed.setThumbnail(`http://openweathermap.org/img/wn/${weather.current.weather[0].icon}@2x.png`);
            embed.addField(`**Temperature**`, (
                `Current: **${weather.current.temp.toFixed(1)}°C** (**${HandlerUtil.toFahrenheit(weather.current.temp)}°F**)\n` +
                `Min: **${weather.daily[0]!.temp.min.toFixed(1)}°C** (**${HandlerUtil.toFahrenheit(weather.daily[0]!.temp.min)}°F**)\n` +
                `Max: **${weather.daily[0]!.temp.max.toFixed(1)}°C** (**${HandlerUtil.toFahrenheit(weather.daily[0]!.temp.max)}°F**)\n` +
                `Dew Point: **${weather.current.dew_point.toFixed(1)}°C** (**${HandlerUtil.toFahrenheit(weather.current.dew_point)}°F**)\n` +
                `Humidity: **${weather.current.humidity}%**\n` +
                `Pressure: **${HandlerUtil.formatCommas(weather.current.pressure)}hPa**`
            ), true);
            embed.addField(`**Weather**`, (
                `**${HandlerUtil.capitalizeString(weather.current.weather[0].description)}**\n` +
                `Clouds: **${weather.current.clouds}%**\n` +
                `Wind Speed: **${weather.current.wind_speed}km/h**\n` +
                `Wind Deg: **${weather.current.wind_deg}°**\n` +
                `Visibility: **${HandlerUtil.formatCommas(weather.current.visibility)}m**\n` +
                `UV Index: **${weather.current.uvi}**`
            ), true);

            return this.addEmbed(embed);
        }

        public addWeatherForecastEmbed(weather: OpenWeatherData): this {
            const embed = this.createEmbedBuilder();
            const locationString: string = OpenWeatherAPI.getLocationString(weather, true);
            const timeString = WeatherReplyBuilder.formatTimezone(weather.timezone);
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
                const emoji = WeatherEmojis.getWeatherEmoji(this.context!.client, day.weather[0].icon);
                embed.addField(`<t:${day.dt}:D>`, (
                    `**${HandlerUtil.capitalizeString(day.weather[0].description)}** ${emoji}\n` +
                    `Min: **${day.temp.min}°C** (**${HandlerUtil.toFahrenheit(day.temp.min)}°F**)\n` +
                    `Max: **${day.temp.max}°C** (**${HandlerUtil.toFahrenheit(day.temp.max)}°F**)\n` +
                    `Humidity: **${day.humidity}%**\n`
                ), true);
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
            embed.addField('Name', (
                `(CO) Carbon monoxide\n` +
                `(NO) Nitrogen monoxide\n` +
                `(NO₂) Nitrogen dioxide\n` +
                `(O₃) Ozone\n` +
                `(SO₂) Sulphur dioxide\n` +
                `(PM₂.₅) Fine particles matter\n` +
                `(PM₁₀) Coarse particulate matter\n` +
                `(NH₃) Ammonia\n`
            ), true);
            const components = weather.list[0]!.components;
            embed.addField('Quantity', (
                `${WeatherEmojis.getQualityEmoji(this.context!.client, this.getCO(components.co))} ${components.co} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji(this.context!.client, this.getNO(components.no))} ${components.no} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji(this.context!.client, this.getNO2(components.no2))} ${components.no2} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji(this.context!.client, this.getO3(components.o3))} ${components.o3} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji(this.context!.client, this.getSO2(components.so2))} ${components.so2} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji(this.context!.client, this.getPM2_5(components.pm2_5))} ${components.pm2_5} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji(this.context!.client, this.getPM10(components.pm10))} ${components.pm10} μg/m³\n` +
                `${WeatherEmojis.getQualityEmoji(this.context!.client, this.getNH3(components.nh3))} ${components.nh3} μg/m³\n`
            ), true);
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

        public addWeatherOrderSelectMenu(selected: WeatherTempsOrder): this {
            const selectMenu = new SelectMenuBuilder();
            for (const orderName of Object.values(WeatherTempsOrder)) {
                selectMenu.addOptions({
                    label: `Order by ${orderName}`,
                    default: orderName === selected,
                    value: orderName
                });
            }
            selectMenu.setCustomId(WeatherSelectMenuID.ORDER);
            return this.addActionRow(selectMenu.toActionRow());
        }

        public addWeatherActionRow(components: WeatherComponentID[], location: LatLonData): this {
            const actionRow = new ActionRowBuilder();
            components.forEach((component) => { actionRow.addComponents(this.addWeatherButton(component)); });
            actionRow.addViewOnlineButton(OpenWeatherAPI.getGoogleMapsLink(location));
            return this.addActionRow(actionRow);
        }

        public addWeatherPageActionRow(pageData: WeatherViewData): this {
            if (pageData.page == 0 && pageData.totalPages == 1) return this;
            const actionRow = new PageableActionRowBuilder();
            actionRow.addPreviousPageButton(undefined, pageData.totalPages == 1);
            actionRow.addNextPageButton(undefined, pageData.totalPages == 1);
            return this.addActionRow(actionRow);
        }

        private addWeatherButton(display: string): ButtonBuilder {
            const button = new ButtonBuilder().setCustomId(display);
            switch (display) {
                case WeatherComponentID.WARNING:
                    button.setStyle(MessageButtonStyles.DANGER);
                    button.setLabel('⚠️ Weather Alert');
                    break;
                case WeatherComponentID.CURRENT:
                    button.setStyle(MessageButtonStyles.SUCCESS);
                    button.setLabel('Current');
                    break;
                case WeatherComponentID.FORECAST:
                    button.setStyle(MessageButtonStyles.SUCCESS);
                    button.setLabel('Forecast');
                    break;
                case WeatherComponentID.AIR_QUALITY:
                    button.setStyle(MessageButtonStyles.SUCCESS);
                    button.setLabel('Air Quality');
                    break;
                default: throw display;
            }
            return button;
        }

        private getAQIString(aqi: number): string {
            switch (aqi) {
                case 1: { return 'Good'; }
                case 2: { return 'Fair'; }
                case 3: { return 'Moderate'; }
                case 4: { return 'Poor'; }
                case 5: { return 'Very Poor'; }
                default: { return '*unknown*'; }
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
    };
}

export const WeatherSelectMenuID = {
    ORDER: 'order'
};

export enum WeatherComponentID {
    WARNING = 'warning',
    CURRENT = 'current',
    FORECAST = 'forecast',
    AIR_QUALITY = 'air_quality'
}

export enum WeatherTempsOrder {
    HUMIDITY = 'humidity',
    HOTTEST = 'hottest',
    COLDEST = 'coldest',
    TIMEZONE = 'timezone'
}

export interface WeatherViewData {
    page: number,
    perPage: number,
    totalPages: number,
    order: WeatherTempsOrder;
}
