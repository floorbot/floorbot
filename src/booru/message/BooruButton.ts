import { BooruHandler, BooruComponentCustomData } from '../BooruHandler';
import { ComponentCustomData } from 'discord.js-commands';
import { MessageButton } from 'discord.js';

export type ButtonCustomData = ComponentCustomData & BooruComponentCustomData;

export class BooruButton extends MessageButton {

    public readonly handler: BooruHandler;

    constructor(handler: BooruHandler) {
        super();
        this.handler = handler;
    }

    public setCustomId(data: BooruComponentCustomData | string): this {
        if (typeof data === 'string') return super.setCustomId(data);
        const customData: ButtonCustomData = Object.assign({ id: this.handler.id }, data)
        return super.setCustomId(JSON.stringify(customData));
    }
}
