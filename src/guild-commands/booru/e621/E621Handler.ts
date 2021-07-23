import { BooruHandler, E621CommandData, E621EmbedFactory, E621ResponseFactory } from '../../..';

export class E621Handler extends BooruHandler {

    public override readonly embedFactory: E621EmbedFactory;
    public readonly responseFactory: E621ResponseFactory;

    constructor() {
        super({ id: 'e621', nsfw: true, commandData: E621CommandData });
        this.responseFactory = new E621ResponseFactory(this);
        this.embedFactory = new E621EmbedFactory(this);
    }
}
