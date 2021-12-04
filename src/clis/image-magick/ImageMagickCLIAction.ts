import { ImageMagickCLI, ImageMagickCLIErrorCheck, ImageMagickCLISTDIOCallback } from './ImageMagickCLI.js';
import { ProbeResult } from 'probe-image-size';

export type MagickProgress = { [index: string]: { percent: number, counter: number } };
export type ImageMagickCLILoggerCallback = (progress: MagickProgress) => void;
export type ImageMagickCLIArgProvider = (metadata: ProbeResult) => string[];

export interface ImageMagickCLIActionConstructorOptions {
    description: string,
    label: string,
    path?: string
}

export abstract class ImageMagickCLIAction extends ImageMagickCLI {

    public readonly description: string;
    public readonly label: string;

    constructor(options: ImageMagickCLIActionConstructorOptions) {
        super(options.path);
        this.description = options.description;
        this.label = options.label;
    }

    protected abstract getArgs(data: ProbeResult): string[];

    public run(metadata: ProbeResult, loggerCallback: ImageMagickCLILoggerCallback, stdioCallbacks?: ImageMagickCLISTDIOCallback): Promise<Buffer> {
        const args = this.getArgs(metadata);
        const errorCheck = this.getLoggingErrorCheck(loggerCallback);
        return this.execute(args, errorCheck, stdioCallbacks);
    }

    public getLoggingErrorCheck(loggerCallback: ImageMagickCLILoggerCallback): ImageMagickCLIErrorCheck {
        const progress: MagickProgress = {};
        return (reject, string) => {
            string = string.toLowerCase();
            const part = string.split(' ')[0];
            switch (part) {
                case 'classify':
                case 'threshold':
                case 'mogrify':
                case 'dither':
                case 'reduce':
                case 'resize':
                case 'encode':
                case 'save':
                case 'write':
                    if (!progress[part]) progress[part] = { percent: 0, counter: 0 }
                    const match = string.match(/(\d+)(?:%)/);
                    const percent = (match && match[1]) ? parseInt(match[1]) : 0;
                    if (percent === 100) progress[part]!.counter = progress[part]!.counter + 1;
                    progress[part]!.percent = percent;
                    return loggerCallback(progress);
                default:
                    if (/^(?:\r\n|\r|\n)$/.test(string) || string.startsWith('mogrify')) break;
                    console.log(string);
                    return reject(string);
            }
        }
    }
}
