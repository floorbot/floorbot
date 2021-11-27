import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';
import path from 'path';

export class ImageMagickCLIActionPetPet extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: 'Pet Pet',
            description: 'Pet Pet'
        })
    }

    public getArgs(metadata: ProbeResult): string[] {
        return [
            'convert',
            '-density', '1280',
            '-background', 'none',


            metadata.url,
            `${path.resolve()}/res/magick/pet_pet_0.png`,
            `${path.resolve()}/res/magick/pet_pet_1.png`,
            `${path.resolve()}/res/magick/pet_pet_2.png`,
            `${path.resolve()}/res/magick/pet_pet_3.png`,
            `${path.resolve()}/res/magick/pet_pet_4.png`,
            `${path.resolve()}/res/magick/pet_pet_5.png`,
            `${path.resolve()}/res/magick/pet_pet_6.png`,
            '-resize', '256',

            // The -background and -gravity dont seem to be working right
            '-background', 'white', '-gravity', 'South',
            '(', '-clone', '0', '-resize', '100%x100%', '-background', 'white', '-gravity', 'South', '-extent', '256x256+50+0', ')',
            '(', '-clone', '0', '-resize', '100%x95%', '-background', 'white', '-gravity', 'South', '-extent', '256x256+50+0', ')',
            '(', '-clone', '0', '-resize', '100%x90%', '-background', 'white', '-gravity', 'South', '-extent', '256x256+50+0', ')',
            '(', '-clone', '0', '-resize', '100%x85%', '-background', 'white', '-gravity', 'South', '-extent', '256x256+50+0', ')',
            '(', '-clone', '0', '-resize', '100%x90%', '-background', 'white', '-gravity', 'South', '-extent', '256x256+50+0', ')',
            '(', '-clone', '0', '-resize', '100%x95%', '-background', 'white', '-gravity', 'South', '-extent', '256x256+50+0', ')',
            '(', '-clone', '0', '-resize', '100%x100%', '-background', 'white', '-gravity', 'South', '-extent', '256x256+50+0', ')',

            '(', '-clone', '8', '-clone', '1', '-flatten', ')',
            '(', '-clone', '9', '-clone', '2', '-flatten', ')',
            '(', '-clone', '10', '-clone', '3', '-flatten', ')',
            '(', '-clone', '11', '-clone', '4', '-flatten', ')',
            '(', '-clone', '12', '-clone', '5', '-flatten', ')',
            '(', '-clone', '13', '-clone', '6', '-flatten', ')',
            '(', '-clone', '14', '-clone', '7', '-flatten', ')',


            // '-resize', '128',

            // '(', '-clone', '0', ')',

            '-delete', '0-14',

            '-delay', '5', '-loop', '0',


            // '-coalesce',
            // '-resize', '2073600@>',
            // '-quality', '1',
            '-monitor',
            `gif:-`
        ]
    }
}
