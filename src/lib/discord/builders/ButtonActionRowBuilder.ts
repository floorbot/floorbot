import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import { ButtonStyle } from 'discord.js';

export enum ButtonComponentID {
    PREVIOUS_PAGE = 'past_page',
    NEXT_PAGE = 'next_page',
    DELETE = 'delete',
    YES = 'yes',
    NO = 'no'
}

export class ButtonActionRowBuilder extends ActionRowBuilder<ButtonBuilder> {

    public addViewOnlineButton(url: string): this {
        const button = new ButtonBuilder()
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View Online');
        return this.addComponents(button);
    }

    public addDeleteButton(): this {
        const button = new ButtonBuilder()
            .setLabel('✖️')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.DELETE);
        return this.addComponents(button);
    }

    public addYesButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success)
            .setCustomId(ButtonComponentID.YES);
        return this.addComponents(button);
    }

    public addNoButton(): this {
        const button = new ButtonBuilder()
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.NO);
        return this.addComponents(button);
    }
};
