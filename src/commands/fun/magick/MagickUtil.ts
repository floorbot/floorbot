import { ImageMagickCLIActionLiquidscale } from '../../../clis/image-magick/actions/ImageMagickCLIActionLiquidscale.js';
import { ImageMagickCLIActionGreyscale } from '../../../clis/image-magick/actions/ImageMagickCLIActionGreyscale.js';
import { ImageMagickCLIActionEightBit } from '../../../clis/image-magick/actions/ImageMagickCLIActionEightBit.js';
import { ImageMagickCLIActionHugemoji } from '../../../clis/image-magick/actions/ImageMagickCLIActionHugemoji.js';
import { ImageMagickCLIActionPixelate } from '../../../clis/image-magick/actions/ImageMagickCLIActionPixelate.js';
import { ImageMagickCLIActionCartoon } from '../../../clis/image-magick/actions/ImageMagickCLIActionCartoon.js';
import { ImageMagickCLIActionDeepfry } from '../../../clis/image-magick/actions/ImageMagickCLIActionDeepFry.js';
import { ImageMagickCLIActionReverse } from '../../../clis/image-magick/actions/ImageMagickCLIActionReverse.js';
import { ImageMagickCLIActionSketch } from '../../../clis/image-magick/actions/ImageMagickCLIActionSketch.js';
import { ImageMagickCLIActionHyper } from '../../../clis/image-magick/actions/ImageMagickCLIActionHyper.js';
import { ImageMagickCLIActionJPEG } from '../../../clis/image-magick/actions/ImageMagickCLIActionJPEG.js';
import { ImageMagickCLIAction } from '../../../clis/image-magick/ImageMagickCLIAction.js';

export class MagickUtil {

    public static makeActions(path?: string): { [index: string]: ImageMagickCLIAction } {
        return {
            ['CARTOON']: new ImageMagickCLIActionCartoon(path),
            ['DEEBFRY']: new ImageMagickCLIActionDeepfry(path),
            ['EIGHT_BIT']: new ImageMagickCLIActionEightBit(path),
            ['GREYSCALE']: new ImageMagickCLIActionGreyscale(path),
            ['HUGEMOJI']: new ImageMagickCLIActionHugemoji(path),
            ['HYPER']: new ImageMagickCLIActionHyper(path),
            ['JPEG']: new ImageMagickCLIActionJPEG(path),
            ['LIQUIDSCALE']: new ImageMagickCLIActionLiquidscale(path),
            ['PIXELATE']: new ImageMagickCLIActionPixelate(path),
            ['REVERSE']: new ImageMagickCLIActionReverse(path),
            ['SKETCH']: new ImageMagickCLIActionSketch(path)
        }
    }
}
