import { HandlerContext, HandlerOptions } from 'discord.js-commands';
import { CommonResponseFactory, CommonHandler } from '../..';

export class InternalHandler extends CommonHandler {

    public readonly responseFactory: CommonResponseFactory<InternalHandler>;

    constructor(options: HandlerOptions) {
        super(options);
        this.responseFactory = new CommonResponseFactory(this);
    }

    public override async isEnabled(_context: HandlerContext): Promise<boolean> {
        return true;
    }
}
