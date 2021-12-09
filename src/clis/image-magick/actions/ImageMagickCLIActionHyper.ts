import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';

export class ImageMagickCLIActionHyper extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: 'Hyper',
            description: 'Add a red filter and speed increase to images'
        })
    }

    public getArgs(metadata: ProbeResult): string[] {
        return [
            'convert',
            '-delay', '1x50',
            '-density', '1280',
            '-background', 'none',
            metadata.url,
            '-coalesce',
            '-resize', '2073600@>',
            '-colorspace', 'RGB',

            '-color-matrix', '3x3: 255,0,0,0,0.4,0,0,0,0.4',
            // red = 200xred+0xgreen+0xblue and so on

            // '-channel-fx', 'red=100%',
            // '-channel', 'Green', '-fx', 'u*0.8', '+channel',
            // '-channel', 'Blue', '-fx', 'u*0.8', '+channel',
            '-scale', '250%',
            '-resize', '128<',
            '-monitor',
            `${metadata.type.toUpperCase()}:-`
        ]
    }
}
