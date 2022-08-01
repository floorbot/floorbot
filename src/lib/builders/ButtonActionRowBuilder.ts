import { ButtonBuilder, ButtonBuilderData } from './ButtonBuilder.js';
import { ActionRowBuilder } from './ActionRowBuilder.js';
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

export class ButtonActionRowBuilder extends ActionRowBuilder<ButtonBuilder<any>> {

    public addViewOnlineButton(url: string, data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View Online');
        return this.addComponents(button);
    }

    public addViewMessageButton(url: string, data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View Message');
        return this.addComponents(button);
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
        return this.addComponents(button);
    }

    public addDeleteButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.Delete);
        return this.addComponents(button);
    }

    public addRemoveButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Remove')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.Remove);
        return this.addComponents(button);
    }

    public addAgreeButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Agree')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(ButtonComponentID.Agree);
        return this.addComponents(button);
    }

    public addDisagreeButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Disagree')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(ButtonComponentID.Disagree);
        return this.addComponents(button);
    }

    public addYesButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success)
            .setCustomId(ButtonComponentID.Yes);
        return this.addComponents(button);
    }

    public addNoButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ButtonComponentID.No);
        return this.addComponents(button);
    }
};
