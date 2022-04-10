import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import { ButtonBuilderData } from './ButtonBuilder.js';
import { ButtonStyle } from 'discord.js';

export enum ButtonComponentID {
    Save = 'save',
    Heart = 'heart',
    Cross = 'cross',
    Delete = 'delete',
    Remove = 'remove',
    Agree = 'agree',
    Disagree = 'disagree',
    Yes = 'yes',
    No = 'no'
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

    public addViewMessageButton(url: string, data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View Message');
        return this.addComponent(button);
    }

    public addSaveButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('save')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.Save);
        return this.addComponents(button);
    }

    public addHeartButton(hearts?: number | null, data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel(`❤️ ${hearts ? hearts : ''}`)
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.Heart);
        return this.addComponents(button);
    }

    public addCrossButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('✖️')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.Cross);
        return this.addComponent(button);
    }

    public addDeleteButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.Delete);
        return this.addComponent(button);
    }

    public addRemoveButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Remove')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.Remove);
        return this.addComponent(button);
    }

    public addAgreeButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Agree')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(ButtonComponentID.Agree);
        return this.addComponent(button);
    }

    public addDisagreeButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Disagree')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(ButtonComponentID.Disagree);
        return this.addComponent(button);
    }

    public addYesButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success)
            .setCustomId(ButtonComponentID.Yes);
        return this.addComponent(button);
    }

    public addNoButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.No);
        return this.addComponent(button);
    }
};
