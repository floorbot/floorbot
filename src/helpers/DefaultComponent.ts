import { APIButtonComponent, ButtonStyle } from 'discord.js';
import { ButtonBuilder } from '@discordjs/builders';

export enum DefaultComponentID {
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

export class DefaultComponent {

    public static viewOnlineButton(data: Partial<APIButtonComponent> & { url: string; }): ButtonBuilder {
        return new ButtonBuilder(data)
            .setURL(data.url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View Online');
    }

    public static viewMessageButton(data: Partial<APIButtonComponent> & { url: string; }): ButtonBuilder {
        return new ButtonBuilder(data)
            .setURL(data.url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View Message');
    }

    public static saveButton(data?: Partial<APIButtonComponent>): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('save')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(DefaultComponentID.Save);
    }

    public static heartButton(data: Partial<APIButtonComponent> & { hearts?: number | null; } = {}): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel(`❤️ ${data.hearts ? data.hearts : ''}`)
            .setStyle(ButtonStyle.Danger)
            .setCustomId(DefaultComponentID.Heart);
    }

    public static crossButton(data?: Partial<APIButtonComponent>): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('✖️')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(DefaultComponentID.Cross);
    }

    public static deleteButton(data?: Partial<APIButtonComponent>): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(DefaultComponentID.Delete);
    }

    public static removeButton(data?: Partial<APIButtonComponent>): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('Remove')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(DefaultComponentID.Remove);
    }

    public static agreeButton(data?: Partial<APIButtonComponent>): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('Agree')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(DefaultComponentID.Agree);
    }

    public static disagreeButton(data?: Partial<APIButtonComponent>): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('Disagree')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(DefaultComponentID.Disagree);
    }

    public static yesButton(data?: Partial<APIButtonComponent>): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success)
            .setCustomId(DefaultComponentID.Yes);
    }

    public static noButton(data?: Partial<APIButtonComponent>): ButtonBuilder {
        return new ButtonBuilder(data)
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(DefaultComponentID.No);
    }
}
