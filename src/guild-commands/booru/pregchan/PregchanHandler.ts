import { BooruHandler, PregchanCommandData, PregchanEmbedFactory, PregchanResponseFactory } from '../../..';

export class PregchanHandler extends BooruHandler {

    public override readonly embedFactory: PregchanEmbedFactory;
    public readonly responseFactory: PregchanResponseFactory;

    constructor() {
        super({ id: 'pregchan', nsfw: true, commandData: PregchanCommandData });
        this.responseFactory = new PregchanResponseFactory(this);
        this.embedFactory = new PregchanEmbedFactory(this);
    }
}
