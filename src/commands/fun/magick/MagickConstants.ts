import { HandlerCustomData } from 'discord.js-commands';
import * as probe from 'probe-image-size';

export interface MagickCustomData extends HandlerCustomData { }

export interface MagickAction {
    readonly label: string;
    readonly description: string;
    getArgs(data: probe.ProbeResult): Array<string>;
}

export type MagickProgress = { [index: string]: { percent: number, counter: number } };

export const MagickAction: { [index: string]: MagickAction } = {
    ['8BIT']: {
        label: '8-bit',
        description: 'Use only 8-bit colour',
        getArgs: (data: probe.ProbeResult): Array<string> => {
            return [
                'convert',
                '-density', '1280',
                '-background', 'none',
                data.url,
                '-coalesce',
                '-resize', '2073600@>',
                '-scale', '40%',
                '-colors', '8',
                '-scale', '250%',
                '-resize', '128<',
                '-monitor',
                `${data.type.toUpperCase()}:-`
            ]
        }
    },
    ['CARTOON']: {
        label: 'Cartoon',
        description: 'Give the image a cartoon effect',
        getArgs: (data: probe.ProbeResult): Array<string> => {
            return [
                'convert',
                '-density', '1280',
                '-background', 'none',
                data.url,
                '-coalesce',
                '-resize', '2073600@>',
                '-scale', '40%',
                '-colors', '8',
                '-scale', '250%',
                '-resize', '128<',
                '-monitor',
                `${data.type.toUpperCase()}:-`
            ]
        }
    },
    ['DEEPFRY']: {
        label: 'Deepfry',
        description: 'Deepfry the image and see what happens',
        getArgs: (data: probe.ProbeResult): Array<string> => {
            return [
                'convert',
                '-density', '1280',
                '-background', 'none',
                data.url,
                '-coalesce',
                '-resize', '2073600@>',
                '-posterize', '10',
                '-morphology', 'Convolve', '3x3: -2, -1, 0, -1, 1, 1, 0, 1, 2',
                // '-attenuate', '1', '+noise', 'gaussian', // Linux issue
                '-level', '25%,75%',
                '-resize', '128<',
                '-monitor',
                `${data.type.toUpperCase()}:-`
            ]
        }
    },
    ['GREYSCALE']: {
        label: 'Greyscale',
        description: 'Remove all colour from images',
        getArgs: (data: probe.ProbeResult): Array<string> => {
            return [
                'convert',
                '-density', '1280',
                '-background', 'none',
                data.url,
                '-coalesce',
                '-resize', '2073600@>',
                '-colorspace', 'Gray',
                '-resize', '128<',
                '-monitor',
                `${data.type.toUpperCase()}:-`
            ]
        }
    },
    ['HUGEMOJI']: {
        label: 'Hugemoji',
        description: 'Make small images bigger',
        getArgs: (data: probe.ProbeResult): Array<string> => {
            return [
                'convert',
                '-density', '1280',
                '-background', 'none',
                data.url,
                '-coalesce',
                '-resize', '2073600@>',
                '-resize', '256<',
                '-monitor',
                `${data.type.toUpperCase()}:-`
            ]
        }
    },
    ['HYPER']: {
        label: 'Hyper',
        description: 'Add a red filter and speed increase to images',
        getArgs: (data: probe.ProbeResult): Array<string> => {
            return [
                'convert',
                '-delay', '1x50',
                '-density', '1280',
                '-background', 'none',
                data.url,
                '-coalesce',
                '-resize', '2073600@>',
                '-colorspace', 'RGB',

                '-color-matrix', '3x3: 255,0,0,0,0.4,0,0,0,0.4',
                // red = 200xred+0xgreen+0xblue and so on

                // '-channel-fx', 'red=100%',
                // '-channel', 'Green', '-fx', 'u*0.8', '+channel',
                // '-channel', 'Blue', '-fx', 'u*0.8', '+channel',
                '-scale', '250%',
                '-resize', '128<',
                '-monitor',
                `${data.type.toUpperCase()}:-`
            ]
        }
    },
    ['JPEG']: {
        label: 'JPEG',
        description: 'Compress the image to jpeg quality',
        getArgs: (data: probe.ProbeResult): Array<string> => {
            return [
                'convert',
                '-density', '1280',
                '-background', 'none',
                data.url,
                '-coalesce',
                '-resize', '2073600@>',
                '-quality', '1',
                '-resize', '128<',
                '-monitor',
                `${data.type.toUpperCase()}:-`
            ]
        }
    },
    ['LIQUID']: {
        label: 'Liquidscale',
        description: 'Only trying this effect can describe it',
        getArgs: (data: probe.ProbeResult): Array<string> => {
            return [
                'convert',
                '-density', '1280',
                '-background', 'none',
                data.url,
                '-coalesce',
                '-resize', '2073600@>',
                '-resize', '256<',
                '-resize', '200%\!',
                '-liquid-rescale', '50%\!',
                '-monitor',
                `${data.type.toUpperCase()}:-`
            ]
        }
    },
    ['PIXELATE']: {
        label: 'Pixelate',
        description: 'Pixelate images and make them hard to see',
        getArgs: (data: probe.ProbeResult): Array<string> => {
            return [
                'convert',
                '-density', '1280',
                '-background', 'none',
                data.url,
                '-coalesce',
                '-resize', '2073600@>',
                '-resize', '128<',
                '-scale', '10%',
                '-scale', '1000%',
                '-monitor',
                `${data.type.toUpperCase()}:-`
            ]
        }
    },
    ['SKETCH']: {
        label: 'Sketch',
        description: 'Make images look like they are drawn',
        getArgs: (data: probe.ProbeResult): Array<string> => {
            return [
                'convert',
                '-density', '1280',
                '-background', 'none',
                data.url,
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
                `${data.type.toUpperCase()}:-`
            ]
        }
    }
}
