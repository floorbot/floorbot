import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import { ButtonBuilderData } from './ButtonBuilder.js';
import { ButtonStyle } from 'discord.js';

export enum ButtonComponentID {
    PREVIOUS_PAGE = 'past_page',
    NEXT_PAGE = 'next_page',
    DELETE = 'delete',
    YES = 'yes',
    NO = 'no'
}

export class ButtonActionRowBuilder extends ActionRowBuilder<ButtonBuilder> {

    public addComponent(component: ButtonBuilder): this {
        return this.addComponents(component);
    }

    public addViewOnlineButton(url: string, data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View Online');
        return this.addComponent(button);
    }

    public addDeleteButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('✖️')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.DELETE);
        return this.addComponent(button);
    }

    public addYesButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success)
            .setCustomId(ButtonComponentID.YES);
        return this.addComponent(button);
    }

    public addNoButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.NO);
        return this.addComponent(button);
    }
};
