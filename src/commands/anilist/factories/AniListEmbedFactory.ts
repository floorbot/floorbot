import { Util } from 'discord.js';
import { FuzzyDate } from '../api/interfaces/Common';

export class AniListEmbedFactory {

    public static getFuzzyDateString(fuzzy: FuzzyDate) {
        const date = new Date();
        if (fuzzy.day && fuzzy.month && fuzzy.year) {
            date.setDate(fuzzy.day);
            date.setMonth(fuzzy.month - 1);
            date.setFullYear(fuzzy.year);
            return `<t:${Math.round(date.getTime() / 1000)}:D>`;
        } else if (!fuzzy.day && !fuzzy.month && !fuzzy.month) {
            return 'unknown'
        } else {
            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return [fuzzy.month ? months[fuzzy.month - 1] : null, fuzzy.day, fuzzy.year].filter(part => part || part === 0).join(' ')
        }
    }

    public static reduceDescription(description: string) {
        return Util.splitMessage(description.replace(/<\/?[^>]+(>|$)/g, ''), { char: ' ', append: '...', maxLength: 1024 })[0]!
    }

    // public static getCharacterEmbed(handler: AniListHandler, context: HandlerContext, character: Character): HandlerEmbed {
    //     const embed = handler.getEmbedTemplate(context);
    //
    //     if (character.name) {
    //         const title = character.name.full || character.name.native;
    //         if (title) embed.setTitle(title);
    //     }
    //     if (character.siteUrl) embed.setURL(character.siteUrl);
    //     if (character.image) {
    //         const image = character.image.large || character.image.medium;
    //         if (image) embed.setThumbnail(image);
    //     }
    //
    //     embed.setDescription([
    //         ...(character.name && character.name.native ? [`Weeb Name: **${character.name.native}**`] : []),
    //         ...(character.favourites ? [`Favourites: **${Util.formatCommas(character.favourites)}**`] : []),
    //         ...(character.gender ? [`Gender: **${character.gender}**`] : []),
    //         ...(character.age ? [`Age: **${character.age}**`] : []),
    //         ...(character.dateOfBirth ? [`Birthday: **${AniListEmbedFactory.getFuzzyDateString(character.dateOfBirth)}**`] : []),
    //         ...(character.bloodType ? [`Blood Type: **${character.bloodType}**`] : [])
    //     ].join('\n'));
    //
    //     if (character.description) embed.addField('Description', AniListEmbedFactory.reduceDescription(character.description), false)
    //     return embed;
    // }
}
