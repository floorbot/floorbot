import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';

export class ImageMagickCLIActionPixelate extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: 'Pixelate',
            description: 'Pixelate images and make them hard to see'
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
            '-resize', '128<',
            '-scale', '10%',
            '-scale', '1000%',
            '-monitor',
            `${metadata.type.toUpperCase()}:-`
        ]
    }
}
