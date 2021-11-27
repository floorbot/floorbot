import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';

export class ImageMagickCLIActionDeepfry extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: 'Deepfry',
            description: 'Deepfry the image and see what happens'
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
            '-posterize', '10',
            '-morphology', 'Convolve', '3x3: -2, -1, 0, -1, 1, 1, 0, 1, 2',
            // '-attenuate', '1', '+noise', 'gaussian', // Linux issue
            '-level', '25%,75%',
            '-resize', '128<',
            '-monitor',
            `${metadata.type.toUpperCase()}:-`
        ]
    }
}
