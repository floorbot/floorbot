import Discord, { AnyComponentBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageActionRowComponentBuilder, ModalActionRowComponentBuilder } from 'discord.js';
import { ReplyBuilder, ResponseOptions } from '../../discord.js/builders/ReplyBuilder.js';

export type ActionRowBuilderData = ConstructorParameters<typeof ActionRowBuilder>[0];

export class ActionRowBuilder<T extends AnyComponentBuilder> extends Discord.ActionRowBuilder<T> {

    public toReplyOptions(replyOptions: ResponseOptions = {}): ReplyBuilder {
        if (!this.isMessageActionRowBuilder()) throw 'ActionRowBuilder cannot be used to create ReplyBuilder';
        return new ReplyBuilder(replyOptions).addComponents(this);
    }

    public isModalActionRowBuilder(): this is ActionRowBuilder<ModalActionRowComponentBuilder> {
        return !this.isMessageActionRowBuilder();
    }

    public isMessageActionRowBuilder(): this is ActionRowBuilder<MessageActionRowComponentBuilder> {
        return this.components.some(component => component.data.type === ComponentType.TextInput);
    }
}

export enum ComponentID {
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

export class ModalActionRowBuilder extends ActionRowBuilder<ModalActionRowComponentBuilder> { }

export class MessageActionRowBuilder extends ActionRowBuilder<MessageActionRowComponentBuilder> {

    public addViewOnlineButton(url: string): this {
        const button = new ButtonBuilder()
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View Online');
        return this.addComponents(button);
    }

    public addViewMessageButton(url: string): this {
        const button = new ButtonBuilder()
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View Message');
        return this.addComponents(button);
    }

    public addSaveButton(): this {
        const button = new ButtonBuilder()
            .setLabel('save')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ComponentID.Save);
        return this.addComponents(button);
    }

    public addHeartButton(hearts?: number | null): this {
        const button = new ButtonBuilder()
            .setLabel(`❤️ ${hearts ? hearts : ''}`)
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ComponentID.Heart);
        return this.addComponents(button);
    }

    public addCrossButton(): this {
        const button = new ButtonBuilder()
            .setLabel('✖️')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ComponentID.Cross);
        return this.addComponents(button);
    }

    public addDeleteButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ComponentID.Delete);
        return this.addComponents(button);
    }

    public addRemoveButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Remove')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ComponentID.Remove);
        return this.addComponents(button);
    }

    public addAgreeButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Agree')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(ComponentID.Agree);
        return this.addComponents(button);
    }

    public addDisagreeButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Disagree')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(ComponentID.Disagree);
        return this.addComponents(button);
    }

    public addYesButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success)
            .setCustomId(ComponentID.Yes);
        return this.addComponents(button);
    }

    public addNoButton(): this {
        const button = new ButtonBuilder()
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(ComponentID.No);
        return this.addComponents(button);
    }
}
