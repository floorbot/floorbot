import { AudioPlayerState, createAudioResource, StreamType } from '@discordjs/voice';
import { RadioStationAudioPlayer } from '../RadioStationAudioPlayer.js';

export enum ListenMoeGenre {
    JPop = 'J-pop',
    KPop = 'K-pop'
}

export class ListenMoeStation extends RadioStationAudioPlayer {

    private static readonly MIN_RETRY_TIME: number = 1000 * 60 * 5; // 5 minutes minimum between connections
    private restartTime: number = 0;

    constructor({ genre }: { genre: ListenMoeGenre; }) {
        super({ id: genre, name: `ListenMoe ${genre}`, description: `listen.moe ${genre} radio station` });
        this.on('error', error => console.error(`[Radio](${this.name}) Encountered an error with resource`, error));
        this.on('stateChange', this.handleStateChange);
    }

    public static getResourceURL(genre: string): string {
        switch (genre) {
            case ListenMoeGenre.JPop: return 'https://listen.moe/fallback';
            case ListenMoeGenre.KPop: return 'https://listen.moe/kpop/fallback';
            default: throw `No known resource url for ${genre}`;
        }
    }

    public start(): void {
        const resourceURL = ListenMoeStation.getResourceURL(this.id);
        const resource = createAudioResource(resourceURL, { inputType: StreamType.Arbitrary, inlineVolume: true });
        if (resource.volume) resource.volume.setVolume(0.05);
        this.restartTime = Date.now();
        this.play(resource);
    }

    private handleStateChange(_oldState: AudioPlayerState, newState: AudioPlayerState) {
        if (newState.status === 'idle') {
            const timeSinceRestart = Date.now() - this.restartTime;
            if (timeSinceRestart >= ListenMoeStation.MIN_RETRY_TIME) return this.start();
            return setTimeout(() => this.start(), ListenMoeStation.MIN_RETRY_TIME - timeSinceRestart);
        }
    }
}
