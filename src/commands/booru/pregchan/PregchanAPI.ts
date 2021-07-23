import fetch from 'node-fetch';

export class PregchanAPI {

    public static async threads(search: string = String()): Promise<Array<PregchanAPIThread>> {
        search = search.toLowerCase();
        const res = await fetch('https://pregchan.com/d/catalog.html').then(res => res.text());
        const regex = /(?:href=\"\/d\/res\/)(\d{5})(?:.html)(?:.+?data-subject=")([^"]*)(?:.+?I:\s)(\d+)/gm;
        const matches = [...res.matchAll(regex)];
        return matches.reduce((array, match) => {
            const id = match[1]!;
            const name = match[2]!.replace(/&#039;/g, '\'').replace(/&amp;/g, '&');
            if (!search || id.includes(search) || name.toLowerCase().includes(search)) {
                array.push({
                    id: id,
                    name: name.trim(),
                    total: parseInt(match[3]!),
                    url: `https://pregchan.com/d/res/${id}.html`
                })
            }
            return array;
        }, new Array());
    }

    public static async random(search: string = String()): Promise<PregchanAPIImage | null> {
        const threads = await PregchanAPI.threads(search);
        if (!threads.length) return null;
        const thread = PregchanAPI.randomThread(threads);
        const res = await fetch(`https://pregchan.com/d/res/${thread.id}.html`).then(res => res.text())
        const regex = /(?:<\/p><a href=\"\/d\/src\/)(.*?)(?:")/gm;
        const matches = [...res.matchAll(regex)];
        if (!matches.length) return null;
        const image = matches[matches.length * Math.random() << 0]![1];
        return {
            imageURL: `https://pregchan.com/d/src/${image}`,
            count: matches.length,
            thread: thread
        };
    }

    public static randomThread(threads: Array<PregchanAPIThread>): PregchanAPIThread {
        const totalImages = threads.reduce((total, thread) => total + thread.total, 0);
        let randomIndex = Math.floor(Math.random() * totalImages);
        return threads.find(thread => (randomIndex -= thread.total) < 0)! || threads.pop();
    }
}

export interface PregchanAPIThread {
    readonly id: string,
    readonly name: string,
    readonly total: number,
    readonly url: string
}

export interface PregchanAPIImage {
    readonly imageURL: string,
    readonly count: number,
    readonly thread: PregchanAPIThread
}
