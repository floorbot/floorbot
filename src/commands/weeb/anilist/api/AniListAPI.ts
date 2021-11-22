import { Media, MediaVariables } from './interfaces/Media';
import { Page } from './interfaces/Common';
import fetch from 'node-fetch';

// THESE ARE THE COMPLETED TYPES
export * from './interfaces/Character.js';
export * from './interfaces/Studio.js';
export * from './interfaces/Media.js';
export * from './interfaces/Staff.js';

export interface AniListResponse {
    data: {
        Media?: Media | null
        Page?: Page | null
    }
    errors?: {
        message: string,
        status: number,
        locations: {
            line: number,
            column: number
        }[]
    }[]
}

export type QueryVars = MediaVariables & {
    page?: number,
    perPage?: number
};

export class AniListAPI {

    constructor() {

    }

    public async request(query: string, variables: QueryVars): Promise<AniListResponse> {
        return fetch(`https://graphql.anilist.co`, {
            method: 'POST',
            body: JSON.stringify({ query: query, variables: variables }),
            headers: { 'Content-Type': 'application/json' },
        }).then(res => {
            // console.log(res.headers)
            return res.json()
        });
    }
}
