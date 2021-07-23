import { spawn } from 'child_process';

export type ImageMagickErrorCheck = (reject: (message: string) => any, data: string) => void;

export class ImageMagick {

    static execute(options: Array<string>, errorCheck: ImageMagickErrorCheck) {
        return new Promise((resolve, reject) => {
            const chunks: Array<any> = [];
            const magick = spawn(`${process.env['ImageMagickPath'] || ''}magick`, options);
            magick.stdout.on('data', data => chunks.push(data));
            magick.stderr.on('data', (data) => {
                if (!errorCheck) return reject(data.toString());
                return errorCheck(reject, data.toString());
            });
            magick.on('exit', (_code) => resolve(Buffer.concat(chunks)));
        });
    }
}
