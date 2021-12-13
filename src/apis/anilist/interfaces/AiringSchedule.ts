import { Media } from './Media';

export interface AiringSchedule {
    readonly id?: number,
    readonly airingAt?: number,
    readonly timeUntilAiring?: number,
    readonly episode?: number,
    readonly mediaId?: number,
    readonly media?: Media;
}

export interface AiringScheduleConnection {

}
