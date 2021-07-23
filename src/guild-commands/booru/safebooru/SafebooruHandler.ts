import { BooruHandler, SafebooruCommandData, SafebooruEmbedFactory, SafebooruResponseFactory } from '../../..';

export class SafebooruHandler extends BooruHandler {

    public override readonly embedFactory: SafebooruEmbedFactory;
    public readonly responseFactory: SafebooruResponseFactory;

    constructor() {
        super({ id: 'safebooru', nsfw: true, commandData: SafebooruCommandData });
        this.responseFactory = new SafebooruResponseFactory(this);
        this.embedFactory = new SafebooruEmbedFactory(this);
    }
}
