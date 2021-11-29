import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';

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
            '-resize', '2073600@>',
            '(', '-clone', '0', ')',
            // '(', '-clone', '0', '-blur', '0x2', ')',
            '(', '-clone', '0', '-blur', '0x5', '-segment', '2.5', ')',
            '(', '-clone', '0', '-canny', '0x1+10%+15%', '-negate', '-transparent', 'white', '-blur', '0x0.5', ')',
            '-delete', '0',
            '-flatten',
            '-resize', '128<',
            '-monitor',
            `${metadata.type.toUpperCase()}:-`
        ]
    }

    // public getArgs(metadata: ProbeResult): string[] {
    //     return [
    //         'convert',
    //         '-density', '1280',
    //         '-background', 'none',
    //         metadata.url,
    //         '-coalesce',
    //         '-resize', '2073600@>',
    //         '(',
    //         '-clone', '0',
    //         '-blur', '0x5',
    //         ')',
    //         '(',
    //         '-clone', '0',
    //         '-fill', 'black',
    //         '-colorize', '100',
    //         ')',
    //         '(',
    //         '-clone', '0',
    //         '-define', 'convolve:scale=!',
    //         '-define', 'morphology:compose=Lighten',
    //         '-morphology', 'Convolve', 'Sobel:>',
    //         '-negate',
    //         '-evaluate', 'pow', '5',
    //         '-negate',
    //         '-level', '30x100%',
    //         ')',
    //         '-delete', '0',
    //         '-compose', 'multiply',
    //         '-composite',
    //         '-resize', '128<',
    //         '-monitor',
    //         `${metadata.type.toUpperCase()}:-`
    //     ]
    // }
}
