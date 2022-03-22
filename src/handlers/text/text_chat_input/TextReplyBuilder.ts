import { ReplyBuilder } from "../../../lib/discord/builders/ReplyBuilder.js";
import { DiscordUtil } from '../../../lib/discord/DiscordUtil.js';
import { owoify } from 'owoifyx';

export class TextReplyBuilder extends ReplyBuilder {

    public setOwoifiedContent(content: string): this {
        const owoified = owoify(content);
        const shortened = DiscordUtil.shortenMessage(owoified, { maxLength: 2000 });
        return this.setContent(shortened);
    }

    public setFlippedContent(content: string): this {
        const flipped = content.split('').map(char => {
            const reverse = Object.keys(TextReplyBuilder.FLIP_DATA).find(key => TextReplyBuilder.FLIP_DATA[key] === char);
            return reverse || (TextReplyBuilder.FLIP_DATA[char] ? TextReplyBuilder.FLIP_DATA[char] : char);
        }).reverse().join('');
        const shortened = DiscordUtil.shortenMessage(flipped, { maxLength: 2000 });
        return this.setContent(shortened);
    }

    public set1337Content(content: string): this {
        const leeted = content
            .replace(/o/gi, '0')
            .replace(/l|i/gi, '1')
            .replace(/z/gi, '2')
            .replace(/e/gi, '3')
            .replace(/a/gi, '4')
            .replace(/s/gi, '5')
            .replace(/G/g, '6')
            .replace(/t/gi, '7')
            .replace(/b/gi, '8')
            .replace(/g/g, '9');
        const shortened = DiscordUtil.shortenMessage(leeted, { maxLength: 2000 });
        return this.setContent(shortened);
    }

    public setTinyTextContent(content: string): this {
        const tiny = content.split('').map(char => {
            return TextReplyBuilder.TINY_TEXT_DATA[char] ?? char;
        }).join('');
        const shortened = DiscordUtil.shortenMessage(tiny, { maxLength: 2000 });
        return this.setContent(shortened);
    }

    protected static readonly FLIP_DATA: { [index: string]: string; } = {
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


    protected static readonly TINY_TEXT_DATA: { [index: string]: string; } = {
        "a": "ᵃ",
        "b": "ᵇ",
        "c": "ᶜ",
        "d": "ᵈ",
        "e": "ᵉ",
        "f": "ᶠ",
        "g": "ᵍ",
        "h": "ʰ",
        "i": "ᶦ",
        "j": "ʲ",
        "k": "ᵏ",
        "l": "ᶫ",
        "m": "ᵐ",
        "n": "ᶰ",
        "o": "ᵒ",
        "p": "ᵖ",
        "q": "ᑫ",
        "r": "ʳ",
        "s": "ˢ",
        "t": "ᵗ",
        "u": "ᵘ",
        "v": "ᵛ",
        "w": "ʷ",
        "x": "ˣ",
        "y": "ʸ",
        "z": "ᶻ",
        "A": "ᴬ",
        "B": "ᴮ",
        "C": "ᶜ",
        "D": "ᴰ",
        "E": "ᴱ",
        "F": "ᶠ",
        "G": "ᴳ",
        "H": "ᴴ",
        "I": "ᴵ",
        "J": "ᴶ",
        "K": "ᴷ",
        "L": "ᴸ",
        "M": "ᴹ",
        "N": "ᴺ",
        "O": "ᴼ",
        "P": "ᴾ",
        "Q": "ᑫ",
        "R": "ᴿ",
        "S": "ˢ",
        "T": "ᵀ",
        "U": "ᵁ",
        "V": "ⱽ",
        "W": "ᵂ",
        "X": "ˣ",
        "Y": "ʸ",
        "Z": "ᶻ",
        "`": "`",
        "~": "~",
        "!": "﹗",
        "@": "@",
        "#": "#",
        "$": "﹩",
        "%": "﹪",
        "^": "^",
        "&": "﹠",
        "*": "﹡",
        "(": "⁽",
        ")": "⁾",
        "_": "⁻",
        "-": "⁻",
        "=": "⁼",
        "+": "+",
        "{": "{",
        "[": "[",
        "}": "}",
        "]": "]",
        ":": "﹕",
        ";": "﹔",
        "?": "﹖"
    };
}
