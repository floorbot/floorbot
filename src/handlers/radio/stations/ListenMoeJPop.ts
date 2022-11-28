import { AudioPlayer, createAudioResource, StreamType } from '@discordjs/voice';

export class ListenMoeJPop extends AudioPlayer {

    constructor() {
        super();
        this.on('stateChange', (oldState, newState) => {
            console.log(`[ListenMoeJPop] ${oldState.status} -> ${newState.status}`);
        });
        this.on('error', error => {
            console.error(`[ListenMoeJPop] Error: ${error.message} with resource `);
        });
    }

    public startRadio(): void {
        const resource = createAudioResource('https://listen.moe/fallback', { inputType: StreamType.Arbitrary, inlineVolume: true });
        resource.volume?.setVolume(0.05);
        this.play(resource);
    }
}
