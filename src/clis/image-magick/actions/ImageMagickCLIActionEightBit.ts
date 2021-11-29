import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';

export class ImageMagickCLIActionEightBit extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: '8-bit',
            description: 'Use only 8-bit colour'
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
            '-scale', '40%',
            '-colors', '8',
            '-scale', '250%',
            '-resize', '128<',
            '-monitor',
            `${metadata.type.toUpperCase()}:-`
        ]
    }
}
