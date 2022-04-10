import { PregchanAPIThread } from './interfaces/PregchanAPIThread.js';
import { PregchanAPIImage } from './interfaces/PregchanAPIImage.js';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';

export { PregchanAPIImage, PregchanAPIThread };

export class PregchanAPI {

    private static THREADS_CACHE = new NodeCache({ stdTTL: 60 * 60 });
    private static IMAGES_CACHE = new NodeCache({ stdTTL: 60 * 60 });

    public async allThreads(): Promise<PregchanAPIThread[]> {
        const existing = PregchanAPI.THREADS_CACHE.get('');
        if (existing) return existing as PregchanAPIThread[];
        const res = await fetch('https://pregchan.com/d/catalog.html').then(res => res.text());
        const regex = /(?:href=\"\/d\/res\/)(\d{5})(?:.html)(?:.+?data-subject=")([^"]*)(?:.+?I:\s)(\d+)/gm;
        const matches = [...res.matchAll(regex)];
        const threads = matches.reduce((array, match) => {
            const id = match[1]!;
            const name = match[2]!.replace(/&#039;/g, '\'').replace(/&amp;/g, '&');
            array.push({
                id: id,
                name: name.trim(),
                total: parseInt(match[3]!),
                url: `https://pregchan.com/d/res/${id}.html`
            });
            return array;
        }, new Array());
        PregchanAPI.THREADS_CACHE.set('', threads);
        return threads;
    }

    public async allImages(thread: PregchanAPIThread): Promise<PregchanAPIImage[]> {
        const existing = PregchanAPI.IMAGES_CACHE.get(thread.id);
        if (existing) return existing as PregchanAPIImage[];
        const res = await fetch(`https://pregchan.com/d/res/${thread.id}.html`).then(res => res.text());
        const regex = /(?:<\/p><a href=\"\/d\/src\/)(.*?)(?:")/gm;
        const matches = [...res.matchAll(regex)];
        if (!matches.length) return [];
        const images = matches.map(match => {
            const image = match[1];
            return {
                imageURL: `https://pregchan.com/d/src/${image}`,
                count: matches.length,
                thread: thread
            };
        });
        PregchanAPI.IMAGES_CACHE.set(thread.id, images);
        return images;

    }

    public async searchThreads(search: string = ''): Promise<PregchanAPIThread[]> {
        const threads = await this.allThreads();
        return threads.reduce((array, thread) => {
            if (!search || thread.id.includes(search) || thread.name.toLowerCase().includes(search)) {
                array.push(thread);
            }
            return array;
        }, new Array());
    }

    public async randomImage(search: string = ''): Promise<PregchanAPIImage | null> {
        const threads = await this.searchThreads(search);
        if (!threads.length) return null;
        const thread = PregchanAPI.randomThread(threads);
        const images = await this.allImages(thread);
        if (!images.length) return null;
        return images[images.length * Math.random() << 0]!;
    }

    public static randomThread(threads: PregchanAPIThread[]): PregchanAPIThread {
        const totalImages = threads.reduce((total, thread) => total + thread.total, 0);
        let randomIndex = Math.floor(Math.random() * totalImages);
        return threads.find(thread => (randomIndex -= thread.total) < 0)! || threads.pop();
    }
}
