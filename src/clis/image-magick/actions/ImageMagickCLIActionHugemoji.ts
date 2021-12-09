import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';

export class ImageMagickCLIActionHugemoji extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: 'Hugemoji',
            description: 'Make small images bigger'
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
            '-resize', '256<',
            '-monitor',
            `${metadata.type.toUpperCase()}:-`
        ]
    }
}
