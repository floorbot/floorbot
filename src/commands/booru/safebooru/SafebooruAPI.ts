import fetch from 'node-fetch';
import * as nconf from 'nconf';

export class SafebooruAPI {

    private static async request<T>(endpoint: string, params: Map<string, string>, options: any = {}): Promise<T> {
        options = Object.assign({ method: 'GET' }, options)
        if (!options.headers || !options.headers.Authorization) {
            options.headers = options.headers || {};
            const username = nconf.get('DANBOORU:USERNAME');
            const apiKey = nconf.get('DANBOORU:API_KEY');
            if (username && apiKey) {
                options.headers.Authorization = `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`;
            }
        }
        const paramString: string = Array.from(params).map((param: Array<string>) => `${param[0]}=${param[1]}`).join('&');
        const url: string = `https://safebooru.donmai.us/${endpoint}.json?${paramString}`;
        return fetch(url, options).then((res: any) => res.json());
    }

    public static async count(tags: string = String()): Promise<SafebooruAPICount | SafebooruAPIError> {
        return SafebooruAPI.request('counts/posts', new Map([['tags', tags!]]));
    }

    public static async random(tags: string = String()): Promise<SafebooruAPIPost | SafebooruAPIError> {
        return SafebooruAPI.request('posts/random', new Map([['tags', tags!]]));
    }

    public static async autocomplete(tag: string = String(), limit: number = 10): Promise<Array<any>> {
        return SafebooruAPI.request('autocomplete', new Map([
            ['search[query]', tag],
            ['search[type]', 'tag_query'],
            ['limit', limit.toString()]
        ]));
    }

    public static async get404(): Promise<string> {
        const data = await SafebooruAPI.random('pool:16069');
        if ('large_file_url' in data) return data.large_file_url;
        else return 'https://safebooru.org/images/404.gif';
    }
}

export interface SafebooruAPIError {
    readonly success: boolean,
    readonly message: string,
    readonly backtrace: Array<string>
}

export interface SafebooruAPICount {
    readonly counts: {
        readonly posts: number
    }
}

export interface SafebooruAPIAutocomplete {
    readonly type: string,
    readonly label: string,
    readonly value: string,
    readonly category: number,
    readonly post_count: number,
    readonly antecedent: string | null
}

export interface SafebooruAPIPost {
    readonly id: number,
    readonly created_at: string,
    readonly uploader_id: number,
    readonly score: number,
    readonly source: string,
    readonly md5: string,
    readonly last_comment_bumped_at: string | null,
    readonly rating: string,
    readonly image_width: number,
    readonly image_height: number,
    readonly tag_string: string,
    readonly is_note_locked: boolean,
    readonly fav_count: number,
    readonly file_ext: string,
    readonly last_noted_at: string | null,
    readonly is_rating_locked: boolean,
    readonly parent_id: number | null,
    readonly has_children: boolean,
    readonly approver_id: number,
    readonly tag_count_general: number,
    readonly tag_count_artist: number,
    readonly tag_count_character: number,
    readonly tag_count_copyright: number,
    readonly file_size: number,
    readonly is_status_locked: boolean,
    readonly pool_string: string,
    readonly up_score: number,
    readonly down_score: number,
    readonly is_pending: boolean,
    readonly is_flagged: boolean,
    readonly is_deleted: boolean,
    readonly tag_count: number,
    readonly updated_at: string,
    readonly is_banned: boolean,
    readonly pixiv_id: number,
    readonly last_commented_at: string | null,
    readonly has_active_children: boolean,
    readonly bit_flags: number,
    readonly tag_count_meta: number,
    readonly has_large: boolean,
    readonly has_visible_children: boolean,
    readonly tag_string_general: string,
    readonly tag_string_character: string,
    readonly tag_string_copyright: string,
    readonly tag_string_artist: string,
    readonly tag_string_meta: string,
    readonly file_url: string,
    readonly large_file_url: string,
    readonly preview_file_url: string
}
