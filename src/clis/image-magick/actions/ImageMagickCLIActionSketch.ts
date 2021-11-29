import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';

export class ImageMagickCLIActionSketch extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: 'Sketch',
            description: 'Make images look like they are drawn'
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
            '+clone',
            '-negate',
            '-blur', '0x6',
            ')',
            '-compose', 'ColorDodge',
            '-composite',
            '-modulate', '100,0,100',
            '-auto-level',
            '-resize', '128<',
            '-monitor',
            `${metadata.type.toUpperCase()}:-`
        ]
    }
}
