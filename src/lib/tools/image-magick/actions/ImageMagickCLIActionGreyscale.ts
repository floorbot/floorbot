import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';

export class ImageMagickCLIActionGreyscale extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: 'Greyscale',
            description: 'Remove all colour from images'
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
            '-colorspace', 'Gray',
            '-resize', '128<',
            '-monitor',
            `${metadata.type.toUpperCase()}:-`
        ]
    }
}
