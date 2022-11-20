import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class FloorbotActionRowBuilder extends ActionRowBuilder {

    public override addViewOnlineButton(url: string): this {
        const button = new ButtonBuilder()
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View Online');
        return this.addComponents(button);
    };
}

declare module 'discord.js' {
    export interface ActionRowBuilder {
        addViewOnlineButton(url: string): this;
    }
};

ActionRowBuilder.prototype.addViewOnlineButton = FloorbotActionRowBuilder.prototype.addViewOnlineButton;
