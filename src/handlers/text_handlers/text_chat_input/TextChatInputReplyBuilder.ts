import { ReplyBuilder } from '../../../lib/discord/builders/ReplyBuilder.js';
import { OwoifyReplyMixin } from '../owoify_message/OwoifyReplyBuilder.js';
import { FlipReplyMixin } from '../flip_message/FlipReplyBuilder.js';
import { DiscordUtil } from '../../../lib/discord/DiscordUtil.js';
import mixin from '../../../lib/ts-mixin-extended.js';

export class TextChatInputReplyBuilder extends mixin(ReplyBuilder, OwoifyReplyMixin, FlipReplyMixin) {

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
            return TextChatInputReplyBuilder.TINY_TEXT_DATA[char] ?? char;
        }).join('');
        const shortened = DiscordUtil.shortenMessage(tiny, { maxLength: 2000 });
        return this.setContent(shortened);
    }

    public static readonly TINY_TEXT_DATA: { [index: string]: string; } = {
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
