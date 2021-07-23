import { BooruHandler, Rule34CommandData, Rule34EmbedFactory, Rule34ResponseFactory } from '../../..';

export class Rule34Handler extends BooruHandler {

    public override readonly embedFactory: Rule34EmbedFactory;
    public readonly responseFactory: Rule34ResponseFactory;

    constructor() {
        super({ id: 'rule34', nsfw: true, commandData: Rule34CommandData });
        this.responseFactory = new Rule34ResponseFactory(this);
        this.embedFactory = new Rule34EmbedFactory(this);
    }
}
