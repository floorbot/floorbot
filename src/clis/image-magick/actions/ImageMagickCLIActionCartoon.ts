import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';

// https://im.snibgo.com/carttext.htm
export class ImageMagickCLIActionCartoon extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: 'Cartoon',
            description: 'Give the image a cartoon effect'
        })
    }

    public getArgs(metadata: ProbeResult): string[] {
        return [
            'convert',
            '-density', '1280',
            '-background', 'none',
            metadata.url,
            '-coalesce',
            '-resize', '2073600@>',
            '(',
            '-clone', '0',
            '-blur', '0x5',
            ')',
            '(',
            '-clone', '0',
            '-fill', 'black',
            '-colorize', '100',
            ')',
            '(',
            '-clone', '0',
            '-define', 'convolve:scale=!',
            '-define', 'morphology:compose=Lighten',
            '-morphology', 'Convolve', 'Sobel:>',
            '-negate',
            '-evaluate', 'pow', '5',
            '-negate',
            '-level', '30x100%',
            ')',

            '-delete', '0',
            '-compose', 'over',
            '-composite',
            // '-resize', '128<',
            '-monitor',
            `${metadata.type.toUpperCase()}:-`
        ]
    }
}
