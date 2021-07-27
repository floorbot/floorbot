import { AniListAPI, AniListResponse, Media, MediaType } from '../api/AniListAPI';
import { Page } from '../api/interfaces/Common';
import CacheMap from 'cache-map.js';
import * as fs from 'fs';

export class MediaRequest {

    private static readonly cache = new CacheMap<string, AniListResponse>({ ttl: 1000 * 60 * 60 * 6 }); // 6 hour ttl

    public static async fetchPage(search: string, type: MediaType, page: number, perPage: number): Promise<Page | null> {
        const gql = fs.readFileSync(`${__dirname}/queries/page_media.gql`, 'utf8');
        const vars = { search: search, type: type, page, perPage: perPage };
        const cacheKey = `page-${search}-${type}-${page}-${perPage}`;
        const cached = MediaRequest.cache.get(cacheKey);
        return cached ? cached.data.Page! : AniListAPI.request(gql, vars).then(res => {
            if (res.errors && res.errors[0]!.status !== 404) throw { res };
            if (!res.data.Page) throw { res };
            MediaRequest.cache.set(cacheKey, res);
            return res.data.Page;
        });
    }

    public static async fetchMedia(id: number, type: MediaType): Promise<Media | null> {
        const gql = fs.readFileSync(`${__dirname}/queries/media.gql`, 'utf8');
        const vars = { id: id, type: type };
        const cacheKey = `media-${id}-${type}`;
        const cached = MediaRequest.cache.get(cacheKey);
        return cached ? cached.data.Media! : AniListAPI.request(gql, vars).then(res => {
            if (res.errors && res.errors[0]!.status !== 404) throw { res };
            if (!res.data.Media) throw { res };
            MediaRequest.cache.set(cacheKey, res);
            return res.data.Media;
        });
    }
}
