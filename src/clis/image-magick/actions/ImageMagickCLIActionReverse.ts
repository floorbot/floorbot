import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';

export class ImageMagickCLIActionReverse extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: 'Reverse',
            description: 'Reverse a gif'
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
            '-reverse',
            '-resize', '128<',
            '-monitor',
            `${metadata.type.toUpperCase()}:-`
        ]
    }
}
