import { AudioPlayer, AudioResource, createAudioResource, StreamType } from '@discordjs/voice';

export class ListenMoeJPop extends AudioPlayer {

    private restartTime = 0;

    constructor() {
        super();
        this.on('stateChange', (oldState, newState) => {
            console.log(`[ListenMoeJPop] ${oldState.status} -> ${newState.status}`);
            if (newState.status === 'idle') {
                const timeSinceRestart = Date.now() - this.restartTime;
                if (timeSinceRestart >= 1000 * 60 * 5) return this.startRadio();
                return setTimeout(() => this.startRadio(), 1000 * 60 * 5 - timeSinceRestart);
            }
        });
        this.on('error', error => {
            // This is all for now, I will assume the state will also go to idle
            console.error(`[ListenMoeJPop] Error: ${error.message} with resource `);
        });
        this.startRadio();
    }

    private startRadio(): void {
        console.log('[ListenMoeJPop] Started new resource');
        const resource = this.getResource();
        resource.volume?.setVolume(0.05);
        this.restartTime = Date.now();
        this.play(resource);
    }

    private getResource(): AudioResource {
        return createAudioResource('https://listen.moe/fallback', {
            inputType: StreamType.Arbitrary,
            inlineVolume: true
        });
    }
}
