// import { E621APIAutocomplete } from './interfaces/E621APIAutocomplete.js';
// import { E621APIError } from './interfaces/E621APIError.js';
// import { E621APIPost } from './interfaces/E621APIPost.js';
// import { E621APITag } from './interfaces/E621APITag.js';
// import fetch, { Headers } from 'node-fetch';
// import NodeCache from 'node-cache';

// export { E621APIAutocomplete, E621APIError, E621APIPost, E621APITag };

// export interface E621APIAuth {
//     username: string;
//     apiKey: string;
//     userAgent: string;
// }

// export class E621API {

//     private static AUTOCOMPLETE_CACHE = new NodeCache({ stdTTL: 60 * 60 });
//     private static TAGS_CACHE = new NodeCache({ stdTTL: 60 * 60 });

//     private readonly userAgent: string | null;
//     private readonly secret: string | null;

//     constructor(auth: E621APIAuth) {
//         this.secret = auth ? Buffer.from(`${auth.username}:${auth.apiKey}`).toString('base64') : null;
//         this.userAgent = auth && auth.userAgent ? auth.userAgent : null;
//     }

//     private getHeaders(): Headers {
//         const headers = new Headers();
//         if (this.secret) headers.set('Authorization', `Basic ${this.secret}`);
//         if (this.userAgent) headers.set('User-Agent', this.userAgent);
//         return headers;
//     }

//     private async request(endpoint: string, params?: [string, string | number][]): Promise<any> {
//         const paramString = (params || []).map((param) => `${param[0]}=${param[1]}`).join('&');
//         const url = `https://e621.net/${endpoint}.json?${paramString}`;
//         const options = { method: 'GET', headers: this.getHeaders() };
//         return fetch(url, options).then(res => res.json());
//     }

//     public async tags(tags: string): Promise<Array<E621APITag> | E621APIError> {
//         const cacheKey = tags.toLowerCase();
//         const existing = E621API.TAGS_CACHE.get(cacheKey);
//         if (cacheKey && existing) return existing as Array<E621APITag> | E621APIError;
//         return this.request('tags', [['search[name_matches]', tags]])
//             .then((res: any) => res.tags ? res.tags : res)
//             .then(res => {
//                 if (cacheKey) E621API.TAGS_CACHE.set(cacheKey, res);
//                 return res;
//             });
//     }

//     public async random(tags: string | null): Promise<E621APIPost | E621APIError> {
//         tags = tags ?? '';
//         const res: any = await this.request('posts/random', [['tags', tags]]);
//         return res.post ? res.post : res;
//     }

//     public async autocomplete(tag: string | null): Promise<E621APIAutocomplete[] | E621APIError> {
//         tag = tag ?? '';
//         const cacheKey = tag.toLowerCase();
//         const existing = E621API.AUTOCOMPLETE_CACHE.get(cacheKey);
//         if (cacheKey && existing) return existing as E621APIAutocomplete[];
//         return this.request('tags/autocomplete', [['search[name_matches]', tag]])
//             .then(res => {
//                 if (cacheKey) E621API.AUTOCOMPLETE_CACHE.set(cacheKey, res);
//                 return res;
//             });
//     }

//     public async get404(): Promise<string> {
//         const post = await this.random('pool:16069');
//         if ('file' in post) return post.file.url;
//         else return 'https://cdn.e621.us/sample/f1/13/sample-f113114efd070fdd1778cc9ae63f18c8.jpg';
//     }

//     /** A type guard checking if a response is an error */
//     public static isError(res: any): res is E621APIError {
//         return ('success' in res && res.success === false) || 'error' in res;
//     }
// }
