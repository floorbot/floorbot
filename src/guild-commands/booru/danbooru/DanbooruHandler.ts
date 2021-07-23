import { BooruHandler, DanbooruCommandData, DanbooruEmbedFactory, DanbooruResponseFactory } from '../../../..';

export class DanbooruHandler extends BooruHandler {

    public override readonly embedFactory: DanbooruEmbedFactory;
    public readonly responseFactory: DanbooruResponseFactory;

    constructor() {
        super({ id: 'danbooru', nsfw: true, commandData: DanbooruCommandData });
        this.responseFactory = new DanbooruResponseFactory(this);
        this.embedFactory = new DanbooruEmbedFactory(this);
    }
}
