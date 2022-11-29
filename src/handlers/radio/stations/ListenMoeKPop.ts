import { AudioPlayer, createAudioResource, StreamType } from '@discordjs/voice';

export class ListenMoeKPop extends AudioPlayer {

    constructor() {
        super();
        // this.on('stateChange', (state) => {
        //     // console.log(`[ListenMoeKPop] ${state.status}`);
        // });
        // this.on('error', error => {
        //     // console.error(`[ListenMoeKPop] Error: ${error.message} with resource `);
        // });
    }

    public startRadio(): void {
        const resource = createAudioResource('https://listen.moe/kpop/fallback', { inputType: StreamType.Arbitrary, inlineVolume: true });
        resource.volume?.setVolume(0.05);
        this.play(resource);
    }
}
