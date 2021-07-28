import { AniListAPI, MediaType } from '../../api/AniListAPI';
import { GuildHandlerGroup } from '../../../GuildHandler';
import { AnimeCommandData } from './AnimeCommandData';
import { MediaHandler } from '../media/MediaHandler';
import { Page } from '../../api/interfaces/Common';
import * as fs from 'fs';

export class AnimeHandler extends MediaHandler {

    constructor() {
        super({ id: 'anime', commandData: AnimeCommandData, group: GuildHandlerGroup.ANIME });
    }

    public override async fetchPage(query: string | number, page: number): Promise<Page | null> {
        const vars = {
            page: page,
            perPage: 1,
            type: MediaType.ANIME,
            ...(typeof query === 'number' ?
                { id: query } :
                { search: query }
            )
        }
        const gql = fs.readFileSync(`${__dirname}/../../queries/media.gql`, 'utf8');
        const cacheKey = `${query.toString().toLowerCase()}-${page}`;
        const cached = this.cache.get(cacheKey);
        return cached ? cached.data.Page! : AniListAPI.request(gql, vars).then(res => {
            if (res.errors && res.errors[0]!.status !== 404) throw { res };
            if (!res.data.Page) throw { res };
            this.cache.set(cacheKey, res);
            return res.data.Page;
        });
    }
}
