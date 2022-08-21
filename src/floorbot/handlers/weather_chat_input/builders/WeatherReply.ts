import { AirPollutionData } from '../../../apis/open_weather/interfaces/AirPollutionData.js';
import { WeatherAPIError } from '../../../apis/open_weather/interfaces/WeatherAPIError.js';
import { WeatherSelectMenuOptionValue } from './components/WeatherSelectMenuOption.js';
import { OneCallData } from '../../../apis/open_weather/interfaces/OneCallData.js';
import { GeocodeData } from '../../../apis/open_weather/interfaces/GeocodeData.js';
import { LocationQuery } from '../../../apis/open_weather/OpenWeatherAPI.js';
import { ReplyBuilder } from '../../../../lib/builders/ReplyBuilder.js';
import { WeatherActionRow } from './components/WeatherActionRow.js';
import { WeatherEmojiTable } from '../tables/WeatherEmojiTable.js';
import { WeatherButtonId } from './components/WeatherButton.js';
import WeatherLinkRow from '../tables/WeatherLinkTable.js';
import { Pageable } from '../../../../lib/Pageable.js';
import { WeatherEmbed } from './WeatherEmbed.js';
import { GuildMember, User } from 'discord.js';

export class WeatherReply extends ReplyBuilder {

    public static loading(total: number, current: number): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.loading(total, current));
    }

    public static linked(user: User | GuildMember, onecall: OneCallData, geocode: GeocodeData): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.linked(user, geocode))
            .addComponents(WeatherActionRow.detailButtons(onecall));
    }

    public static unlinked(user: User | GuildMember): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.unlinked(user));
    }

    public static missingLink(user: User | GuildMember): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.missingLink(user));
    }

    public static missingLinkedMembers(): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.missingLinkedMembers());
    }

    public static unknownLocation(location: LocationQuery): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.unknownLocation(location));

    }

    public static missingAdmin(): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.missingAdmin())
            .setEphemeral(true);
    }

    public static openWeatherAPIError(error: WeatherAPIError): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.openWeatherAPIError(error));
    }

    public static allTemps(pageable: Pageable<[OneCallData, GuildMember, WeatherLinkRow]>, emojiTable: WeatherEmojiTable, order?: WeatherSelectMenuOptionValue): WeatherReply {
        switch (order) {
            case WeatherSelectMenuOptionValue.Humidity: pageable.sortPages((link1, link2) => { return link2[0].current.humidity - link1[0].current.humidity; }); break;
            case WeatherSelectMenuOptionValue.Timezone: pageable.sortPages((link1, link2) => { return link2[0].timezone_offset - link1[0].timezone_offset; }); break;
            case WeatherSelectMenuOptionValue.Hottest: pageable.sortPages((link1, link2) => { return link2[0].current.temp - link1[0].current.temp; }); break;
            case WeatherSelectMenuOptionValue.Coldest: pageable.sortPages((link1, link2) => { return link1[0].current.temp - link2[0].current.temp; }); break;
        }
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.allTemps(pageable, emojiTable))
            .addComponents(
                WeatherActionRow.viewOrderSelectMenu(order),
                ...(pageable.totalPages - 1 ? [WeatherActionRow.pageableButtons()] : [])
            );
    }

    public static current({ onecall, geocode }: { onecall: OneCallData, geocode: GeocodeData; }): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.current({ onecall, geocode }))
            .addComponents(WeatherActionRow.detailButtons(onecall, WeatherButtonId.Current));
    }

    public static forecast({ onecall, geocode, emojiTable }: { onecall: OneCallData, geocode: GeocodeData, emojiTable: WeatherEmojiTable; }): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.forecast({ onecall, geocode, emojiTable }))
            .addComponents(WeatherActionRow.detailButtons(onecall, WeatherButtonId.Forecast));
    }

    public static airQuality({ onecall, geocode, airQuality, emojiTable }: { onecall: OneCallData, geocode: GeocodeData, airQuality: AirPollutionData, emojiTable: WeatherEmojiTable; }): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.airQuality({ geocode, airQuality, emojiTable }))
            .addComponents(WeatherActionRow.detailButtons(onecall, WeatherButtonId.AirQuality));
    }

    public static alert({ onecall, geocode }: { onecall: OneCallData, geocode: GeocodeData; }): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.alert({ onecall, geocode }))
            .addComponents(WeatherActionRow.detailButtons(onecall, WeatherButtonId.Alert));
    }
}
