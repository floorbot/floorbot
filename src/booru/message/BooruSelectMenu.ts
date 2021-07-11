import { BooruHandler, BooruComponentCustomData } from '../BooruHandler';
import { ComponentCustomData } from 'discord.js-commands';
import { MessageSelectMenu } from 'discord.js';

export type SelectMenuCustomData = ComponentCustomData & BooruComponentCustomData;

export class BooruSelectMenu extends MessageSelectMenu {

    public readonly handler: BooruHandler;

    constructor(handler: BooruHandler) {
        super();
        this.handler = handler;
    }

    public setCustomId(data: BooruComponentCustomData | string): this {
        if (typeof data === 'string') return super.setCustomId(data);
        const customData: SelectMenuCustomData = Object.assign({ id: this.handler.id }, data)
        return super.setCustomId(JSON.stringify(customData));
    }
}
