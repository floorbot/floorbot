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

    // public static getCharacterNodeEmbed(handler: AniListHandler, context: HandlerContext, character: Character, media: Media, page: number): HandlerEmbed {
    //     if (!media.characters) throw { handler, context, media, page };
    //     if (!media.characters.nodes) throw { handler, context, media, page };
    //     const embed = this.getCharacterEmbed(handler, context, character);
    //     embed.setFooter(`${page + 1}/${media.characters.nodes.length} - ${embed.footer!.text}`, embed.footer!.iconURL);
    //     if (media.coverImage && media.coverImage.color) embed.setColor(parseInt(media.coverImage.color.substring(1), 16));
    //     return embed;
    // }
    //
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
