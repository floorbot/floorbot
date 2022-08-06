import { ActionRowBuilder, ComponentType, MessageActionRowComponentBuilder, ModalActionRowComponentBuilder } from 'discord.js';
import { ReplyBuilder, ResponseOptions } from '../../builders/ReplyBuilder.js';

class BetterActionRowBuilder extends ActionRowBuilder {

    public override toReplyOptions(replyOptions: ResponseOptions = {}): ReplyBuilder {
        if (!this.isMessageActionRowBuilder()) throw 'ActionRowBuilder cannot be used to create ReplyBuilder';
        return new ReplyBuilder(replyOptions).addActionRows(this);
    }

    public override isModalActionRowBuilder(): this is ActionRowBuilder<ModalActionRowComponentBuilder> {
        return !this.isMessageActionRowBuilder();
    }

    public override isMessageActionRowBuilder(): this is ActionRowBuilder<MessageActionRowComponentBuilder> {
        return this.components.some(component => component.data.type === ComponentType.TextInput);
    }
}

declare module 'discord.js' {
    export interface ActionRowBuilder {
        toReplyOptions(replyOptions?: ResponseOptions): ReplyBuilder;
        isModalActionRowBuilder(): this is ActionRowBuilder<ModalActionRowComponentBuilder>;
        isMessageActionRowBuilder(): this is ActionRowBuilder<MessageActionRowComponentBuilder>;
    }
};

ActionRowBuilder.prototype.toReplyOptions = BetterActionRowBuilder.prototype.toReplyOptions;
ActionRowBuilder.prototype.isModalActionRowBuilder = BetterActionRowBuilder.prototype.isModalActionRowBuilder;
ActionRowBuilder.prototype.isMessageActionRowBuilder = BetterActionRowBuilder.prototype.isMessageActionRowBuilder;
