import { ReplyBuilder } from '../../../../lib/discord/builders/ReplyBuilder.js';
import { MixinConstructor } from '../../../../lib/ts-mixin-extended.js';
import { DiscordUtil } from '../../../../lib/discord/DiscordUtil.js';

export class FlipReplyBuilder extends FlipReplyMixin(ReplyBuilder) { };

export function FlipReplyMixin<T extends MixinConstructor<ReplyBuilder>>(Builder: T) {
    return class FlipReplyBuilder extends Builder {

        public setFlippedContent(content: string): this {
            const flipped = content.split('').map(char => {
                const reverse = Object.keys(FlipReplyBuilder.FLIP_DATA).find(key => FlipReplyBuilder.FLIP_DATA[key] === char);
                return reverse || (FlipReplyBuilder.FLIP_DATA[char] ? FlipReplyBuilder.FLIP_DATA[char] : char);
            }).reverse().join('');
            const shortened = DiscordUtil.shortenMessage(flipped, { maxLength: 2000 });
            return this.setContent(shortened);
        }

        public static readonly FLIP_DATA: { [index: string]: string; } = {
            "a": "\u0250",
            "b": "q",
            "c": "\u0254",
            "d": "p",
            "e": "\u01DD",
            "f": "\u025F",
            "g": "\u0183",
            "h": "\u0265",
            "i": "\u0131",
            "j": "\u027E",
            "k": "\u029E",
            "l": "\u0283",
            "m": "\u026F",
            "n": "u",
            "o": "o",
            "p": "d",
            "q": "b",
            "r": "\u0279",
            "s": "s",
            "t": "\u0287",
            "u": "n",
            "v": "\u028C",
            "w": "\u028D",
            "x": "x",
            "y": "\u028E",
            "z": "z",
            "A": "\u2200",
            "B": "B",
            "C": "\u0186",
            "D": "D",
            "E": "\u018E",
            "F": "\u2132",
            "G": "\u05E4",
            "H": "H",
            "I": "I",
            "J": "\u017F",
            "K": "K",
            "L": "\u02E5",
            "M": "W",
            "N": "N",
            "O": "O",
            "P": "\u0500",
            "Q": "Q",
            "R": "R",
            "S": "S",
            "T": "\u2534",
            "U": "\u2229",
            "V": "\u039B",
            "W": "M",
            "X": "X",
            "Y": "\u2144",
            "Z": "Z",
            "0": "0",
            "1": "\u0196",
            "2": "\u1105",
            "3": "\u0190",
            "4": "\u3123",
            "5": "\u03DB",
            "6": "9",
            "7": "\u3125",
            "8": "8",
            "9": "6",
            ".": "\u02D9",
            "[": "]",
            "(": ")",
            "{": "}",
            "?": "\u00BF",
            "&": "\u214B",
            "!": "\u00A1",
            "\"": ",",
            "<": ">",
            "_": "¯",
            ";": "\u061B",
            "\u203F": "\u2040",
            "\u2045": "\u2046",
            "\u2234": "\u2235",
            "\r": "\n"
        };
    };
}
