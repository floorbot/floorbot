import { ReplyBuilder } from '../../../lib/discord.js/builders/ReplyBuilder.js';
import { WeatherAPIError } from '../open_weather/interfaces/WeatherAPIError.js';
import { OneCallData } from '../open_weather/interfaces/OneCallData.js';
import { GeocodeData } from '../open_weather/interfaces/GeocodeData.js';
import { WeatherActionRow } from './components/WeatherActionRow.js';
import { WeatherEmojiTable } from '../tables/WeatherEmojiTable.js';
import { LocationQuery } from '../open_weather/OpenWeatherAPI.js';
import { WeatherButtonId } from './components/WeatherButton.js';
import { GuildChannel, GuildMember, User } from 'discord.js';
import { WeatherEmbed } from './WeatherEmbed.js';

export class WeatherReply extends ReplyBuilder {

    public static loading(total: number, current: number): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.loading(total, current));
    }

    public static linked(user: User | GuildMember, onecall: OneCallData, geocode: GeocodeData): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.linked(user, geocode))
            .addComponents(WeatherActionRow.detailButtons(onecall, WeatherButtonId.Current));
    }

    public static unlinked(user: User | GuildMember): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.unlinked(user));
    }

    public static missingLink(user: User | GuildMember): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.missingLink(user));
    }

    public static missingLinkedMembers(channel: GuildChannel): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.missingLinkedMembers(channel));
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

    public static current({ onecall, geocode }: { onecall: OneCallData, geocode: GeocodeData; }): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.current({ onecall, geocode }))
            .addComponents(WeatherActionRow.detailButtons(onecall, WeatherButtonId.Current));
    }

    public static forecast({ onecall, geocode, emojis }: { onecall: OneCallData, geocode: GeocodeData, emojis: WeatherEmojiTable; }): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.forecast({ onecall, geocode, emojis }))
            .addComponents(WeatherActionRow.detailButtons(onecall, WeatherButtonId.Forecast));
    }

    public static alert({ onecall, geocode }: { onecall: OneCallData, geocode: GeocodeData; }): WeatherReply {
        return new WeatherReply()
            .addEmbeds(WeatherEmbed.alert({ onecall, geocode }))
            .addComponents(WeatherActionRow.detailButtons(onecall, WeatherButtonId.Alert));
    }
}
