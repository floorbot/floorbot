import { spawn } from 'child_process';

export type ImageMagickCLIErrorCheck = (reject: (message: string) => any, data: string) => void;
export type ImageMagickCLISTDIOCallback = ((pipe: any) => void)[];

export class ImageMagickCLI {

    public readonly path: string;

    constructor(path?: string) {
        this.path = path || '';
    }

    public async execute(options: string[], errorCheck?: ImageMagickCLIErrorCheck, stdioCallbacks?: ImageMagickCLISTDIOCallback): Promise<Buffer> {
        stdioCallbacks = stdioCallbacks || [];
        return new Promise((resolve, reject) => {
            const chunks: any[] = [];
            const magick = spawn(`${this.path}magick`, options, { stdio: ['pipe', 'pipe', 'pipe', ...Array(stdioCallbacks!.length).fill('pipe')] });
            stdioCallbacks!.forEach((callback, index) => callback(magick.stdio[index + 3]));
            magick.stdout.on('data', data => chunks.push(data));
            magick.stderr.on('data', (data) => {
                if (!errorCheck) return reject(data.toString());
                return errorCheck(reject, data.toString());
            });
            magick.on('exit', (_code) => resolve(Buffer.concat(chunks)));
        });
    }
}
