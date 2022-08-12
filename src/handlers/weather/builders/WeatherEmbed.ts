import { EmbedBuilder, EmbedBuilderData } from '../../../lib/discord.js/builders/EmbedBuilder.js';
import { LocationQuery, OpenWeatherAPI } from '../open_weather/OpenWeatherAPI.js';
import { WeatherAPIError } from '../open_weather/interfaces/WeatherAPIError.js';
import { OneCallData } from '../open_weather/interfaces/OneCallData.js';
import { GeocodeData } from '../open_weather/interfaces/GeocodeData.js';
import { Pageable } from '../../../helpers/pageable/Pageable.js';
import { GuildMember, User } from 'discord.js';

export class WeatherEmbed extends EmbedBuilder {

    constructor({ data, pageable }: { data?: EmbedBuilderData, pageable?: Pageable<OneCallData>; } = {}) {
        super(data);
        const iconURL = 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg';
        if (pageable) this.setFooter({ text: `${pageable.currentPage}/${pageable.totalPages} - Powered by Urban Dictionary`, iconURL });
        else this.setFooter({ text: `Powered by Urban Dictionary`, iconURL });
    }

    public static loadingEmbed(total: number, current: number): WeatherEmbed {
        const progressBar = new Array(11).fill('▬');
        progressBar[Math.floor(current / total * 10)] = '🟢';
        return new WeatherEmbed()
            .setTitle(`Loading Weather!`)
            .setDescription(`Progress: ${progressBar.join('')} [${Math.round(current / total * 100)}%] ${current}/${total}`);
    }

    public static linkedEmbed(user: User | GuildMember, geocode: GeocodeData): WeatherEmbed {
        const location = OpenWeatherAPI.getLocationString(geocode, true);
        return new WeatherEmbed()
            .setDescription(`Successfully linked location \`${location}\` to ${user} 🥳`);
    }

    public static unlinkedEmbed(user: User | GuildMember): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription(`Successfully unlinked any saved location from ${user} 🤠`);
    }

    public static missingLinkEmbed(user: User | GuildMember): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription(`Sorry! I do not have a saved location for ${user}. Please use \`/weather link\` to set one!`);
    }

    public static missingLinkedMembersEmbed(): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription([
                'There are no members with saved locations in this guild',
                'Please use \`/weather link\` to start comparing weather!'
            ].join('\n'));
    }

    public static unknownLocationEmbed(location: LocationQuery): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription([
                `Sorry! I could not find \`${OpenWeatherAPI.getLocationString(location, true)}\``,
                '*Please check the spelling or try another nearby location*'
            ]);
    }

    public static missingAdminEmbed(): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription(`Sorry! you must be an admin to force link or unlink locations from other people!`);
    }

    public static openWeatherAPIErrorEmbed(error: WeatherAPIError): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription([
                `Sorry I seem to have an API issue:`,
                `*${error.message}*`
            ]);
    }
}
