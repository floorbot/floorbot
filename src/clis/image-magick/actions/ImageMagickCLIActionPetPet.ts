import { ImageMagickCLIAction } from '../ImageMagickCLIAction.js';
import { ProbeResult } from 'probe-image-size';
import path from 'path';

export class ImageMagickCLIActionPetPet extends ImageMagickCLIAction {

    constructor(path?: string) {
        super({
            path: path,
            label: 'PetPet',
            description: 'PetPet'
        })
    }

    public getArgs(metadata: ProbeResult): string[] {
        return [
            'convert',
            '-density', '1280',

            '-delay', '3',
            '-loop', '0',

            '-background', 'black',
            '-gravity', 'south',

            `${path.resolve()}/res/magick/pet_pet_0.png`,                                 // 0
            `${path.resolve()}/res/magick/pet_pet_1.png`,                                 // 1
            `${path.resolve()}/res/magick/pet_pet_2.png`,                                 // 2
            `${path.resolve()}/res/magick/pet_pet_3.png`,                                 // 3
            `${path.resolve()}/res/magick/pet_pet_4.png`,                                 // 4
            `${path.resolve()}/res/magick/pet_pet_5.png`,                                 // 5
            `${path.resolve()}/res/magick/pet_pet_6.png`,                                 // 6
            metadata.url,                                                                 // 7
            '(', '-clone', '7', '-resize', '500x500^', ')',                               // 8 - Force input image to be min 500x500 on both axis

            // -extent is equal 1 / -resize percentage
            '(', '-clone', '8', '-resize', '100%x85%', '-extent', '100%x117.65%', ')',    // 9
            '(', '-clone', '8', '-resize', '100%x85%', '-extent', '100%x117.65%', ')',    // 10
            '(', '-clone', '8', '-resize', '100%x75%', '-extent', '100%x133.33%', ')',    // 11
            '(', '-clone', '8', '-resize', '100%x75%', '-extent', '100%x133.33%', ')',    // 12
            '(', '-clone', '8', '-resize', '100%x85%', '-extent', '100%x117.65%', ')',    // 13
            '(', '-clone', '8', '-resize', '100%x95%', '-extent', '100%x105.26%', ')',    // 14

            // Clone the hands and overlay them on the new image
            '(', '-clone', '8', '-clone', '0', '-flatten', ')',                           // 14
            '(', '-clone', '9', '-clone', '1', '-flatten', ')',                           // 15
            '(', '-clone', '10', '-clone', '2', '-flatten', ')',                          // 16
            '(', '-clone', '11', '-clone', '3', '-flatten', ')',                          // 17
            '(', '-clone', '12', '-clone', '4', '-flatten', ')',                          // 18
            '(', '-clone', '13', '-clone', '5', '-flatten', ')',                          // 19
            '(', '-clone', '14', '-clone', '6', '-flatten', ')',                          // 20

            '-delete', '0-14',

            '-set', 'dispose', 'previous',
            '-transparent-color', 'black',
            '-transparent', 'black',
            '-layers', 'optimize',
            '-layers', 'coalesce',

            '-monitor',
            `gif:-`,
        ]
    }
}
