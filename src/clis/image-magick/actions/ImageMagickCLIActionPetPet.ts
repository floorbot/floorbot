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
            '-background', 'none',

            '-delay', '5',
            '-loop', '0',
            '-dispose', 'previous',

            `${path.resolve()}/res/magick/pet_pet_0.png`,          // 0
            `${path.resolve()}/res/magick/pet_pet_1.png`,          // 1
            `${path.resolve()}/res/magick/pet_pet_2.png`,          // 2
            `${path.resolve()}/res/magick/pet_pet_3.png`,          // 3
            `${path.resolve()}/res/magick/pet_pet_4.png`,          // 4
            `${path.resolve()}/res/magick/pet_pet_5.png`,          // 5
            `${path.resolve()}/res/magick/pet_pet_6.png`,          // 6
            metadata.url,                                          // 7

            '(', '-clone', '7', '-resize', '500x500^', ')',        // 8 - Force input image to be min 500x500 on both axis

            '(', '-clone', '8', '-background', 'white', '-gravity', 'south', '-resize', '100%x95%', '-extent', '100%x105%', ')',           // 9
            '(', '-clone', '8', '-background', 'white', '-gravity', 'south', '-resize', '100%x90%', '-extent', '100%x110%', ')',           // 10
            '(', '-clone', '8', '-background', 'white', '-gravity', 'south', '-resize', '100%x85%', '-extent', '100%x115%', ')',           // 11
            '(', '-clone', '8', '-background', 'white', '-gravity', 'south', '-resize', '100%x90%', '-extent', '100%x110%', ')',           // 12
            '(', '-clone', '8', '-background', 'white', '-gravity', 'south', '-resize', '100%x95%', '-extent', '100%x105%', ')',           // 13

            // Clone the hands and overlay them on the new image
            '(', '-clone', '8', '-clone', '0', '-flatten', ')',
            '(', '-clone', '9', '-clone', '1', '-flatten', ')',
            '(', '-clone', '10', '-clone', '2', '-flatten', ')',
            '(', '-clone', '11', '-clone', '3', '-flatten', ')',
            '(', '-clone', '12', '-clone', '4', '-flatten', ')',
            '(', '-clone', '13', '-clone', '5', '-flatten', ')',
            '(', '-clone', '8', '-clone', '6', '-flatten', ')',

            '-delete', '0-13',

            '-monitor',
            `gif:-`,
        ]
    }
}
