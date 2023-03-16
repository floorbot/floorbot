import { AudioPlayer } from '@discordjs/voice';

export abstract class RadioStationAudioPlayer extends AudioPlayer {

    public id: string;
    public name: string;
    public description: string;

    constructor({ id, name, description }: { id: string, name: string, description: string; }) {
        super();
        this.id = id;
        this.name = name;
        this.description = description;
    }

    public abstract start(): void;
}
