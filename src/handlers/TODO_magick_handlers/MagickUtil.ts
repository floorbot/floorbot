import { ImageMagickCLIActionLiquidscale } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionLiquidscale.js';
import { ImageMagickCLIActionGreyscale } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionGreyscale.js';
import { ImageMagickCLIActionEightBit } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionEightBit.js';
import { ImageMagickCLIActionHugemoji } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionHugemoji.js';
import { ImageMagickCLIActionPixelate } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionPixelate.js';
import { ImageMagickCLIActionCartoon } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionCartoon.js';
import { ImageMagickCLIActionDeepfry } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionDeepFry.js';
import { ImageMagickCLIActionReverse } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionReverse.js';
import { ImageMagickCLIActionSketch } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionSketch.js';
import { ImageMagickCLIActionPetPet } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionPetPet.js';
import { ImageMagickCLIActionHyper } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionHyper.js';
import { ImageMagickCLIActionJPEG } from '../../lib/tools/image-magick/actions/ImageMagickCLIActionJPEG.js';
import { ImageMagickCLIAction } from '../../lib/tools/image-magick/ImageMagickCLIAction.js';

export class MagickUtil {

    public static makeActions(path?: string): { [index: string]: ImageMagickCLIAction; } {
        return {
            ['CARTOON']: new ImageMagickCLIActionCartoon(path),
            ['DEEPFRY']: new ImageMagickCLIActionDeepfry(path),
            ['EIGHT_BIT']: new ImageMagickCLIActionEightBit(path),
            ['GREYSCALE']: new ImageMagickCLIActionGreyscale(path),
            ['HUGEMOJI']: new ImageMagickCLIActionHugemoji(path),
            ['HYPER']: new ImageMagickCLIActionHyper(path),
            ['JPEG']: new ImageMagickCLIActionJPEG(path),
            ['LIQUIDSCALE']: new ImageMagickCLIActionLiquidscale(path),
            ['PET_PET']: new ImageMagickCLIActionPetPet(path),
            ['PIXELATE']: new ImageMagickCLIActionPixelate(path),
            ['REVERSE']: new ImageMagickCLIActionReverse(path),
            ['SKETCH']: new ImageMagickCLIActionSketch(path)
        };
    }
}
