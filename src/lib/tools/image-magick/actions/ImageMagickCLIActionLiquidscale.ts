import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';

export class ImageMagickCLIActionLiquidscale extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: 'Liquidscale',
            description: 'Only trying this effect can describe it'
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
            '-resize', '200%\!',
            '-liquid-rescale', '50%\!',
            '-monitor',
            `${metadata.type.toUpperCase()}:-`
        ]
    }
}
