import fetch from 'node-fetch';
import * as nconf from 'nconf';

export class E621API {

    private static async request<T>(endpoint: string, params: Map<string, string>, options: any = {}): Promise<T> {
        options = Object.assign({ method: 'GET' }, options)
        if (!options.headers || !options.headers.Authorization) {
            options.headers = options.headers || {};
            options.headers['User-Agent'] = nconf.get('E621:USER_AGENT') || 'nodejs app';
            const username = nconf.get('E621:USERNAME');
            const apiKey = nconf.get('E621:API_KEY');
            if (username && apiKey) {
                options.headers['Authorization'] = `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`;
            }
        }
        const paramString: string = Array.from(params).map((param: Array<string>) => `${param[0]}=${param[1]}`).join('&');
        const url: string = `https://e621.net/${endpoint}.json?${paramString}`;
        return fetch(url, options).then((res: any) => res.json());
    }

    public static async tags(tags: string = String()): Promise<Array<E621APITag> | E621APIError> {
        const params = new Map<string, string>([['search[name_matches]', tags]]);
        return E621API.request('tags', params).then((res: any) => res.tags ? res.tags : res)
    }

    public static async random(tags: string = String()): Promise<E621APIPost | E621APIError> {
        const params = new Map<string, string>([['tags', tags]]);
        const res: any = await E621API.request('posts/random', params);
        return res.post ? res.post : res;
    }

    public static async autocomplete(tag = String()): Promise<E621APIAutocomplete[]> {
        const params = new Map<string, string>([['search[name_matches]', tag]]);
        return E621API.request('tags/autocomplete', params);
    }

    public static async get404(): Promise<string> {
        const post = await E621API.random('404_(not_found_error)');
        if ('file' in post) return post.file.url;
        return 'https://cdn.donmai.us/sample/f1/13/sample-f113114efd070fdd1778cc9ae63f18c8.jpg';
    }
}

export interface E621APIError {
    readonly success: boolean,
    readonly message: string
}

export interface E621APITag {
    readonly id: number,
    readonly name: string,
    readonly post_count: number,
    readonly related_tags: string,
    readonly related_tags_updated_at: string,
    readonly category: number,
    readonly is_locked: boolean,
    readonly created_at: string,
    readonly updated_at: string
}

export interface E621APIAutocomplete {
    id: number,
    name: string,
    post_count: number,
    category: number,
    antecedent_name: string | null
}

export interface E621APIPost {
    readonly id: number,
    readonly created_at: string,
    readonly updated_at: string,
    readonly file: {
        readonly width: number,
        readonly height: number,
        readonly ext: string,
        readonly size: number,
        readonly md5: string,
        readonly url: string
    },
    readonly preview: {
        readonly width: number,
        readonly height: number,
        readonly url: string
    },
    readonly sample: {
        readonly has: boolean,
        readonly height: number,
        readonly width: number,
        readonly url: string,
        readonly alternates: {}
    },
    readonly score: {
        readonly up: number,
        readonly down: number,
        readonly total: number
    }
    readonly tags: {
        readonly general: Array<string>,
        readonly species: Array<string>,
        readonly character: Array<string>,
        readonly copyright: Array<string>,
        readonly artist: Array<string>,
        readonly invalid: Array<string>,
        readonly lore: Array<string>,
        readonly meta: Array<string>
    },
    readonly locked_tags: Array<string>,
    readonly change_seq: number,
    readonly flags: {
        readonly pending: boolean,
        readonly flagged: boolean,
        readonly note_locked: boolean,
        readonly status_locked: boolean,
        readonly rating_locked: boolean,
        readonly deleted: boolean
    },
    readonly rating: string,
    readonly fav_count: number,
    readonly sources: Array<string>,
    readonly pools: [],
    readonly relationships: {
        readonly parent_id: number,
        readonly has_children: boolean,
        readonly has_active_children: boolean,
        readonly children: []
    },
    readonly approver_id: number,
    readonly uploader_id: number,
    readonly description: string,
    readonly comment_count: number,
    readonly is_favorited: boolean,
    readonly has_notes: boolean,
    readonly duration: number
}
