import { BaseCommandInteraction, BufferResolvable, Interaction, InteractionReplyOptions, Message } from 'discord.js';
import { HandlerAttachment } from './components/HandlerAttachment.js';
import { HandlerSelectMenu } from './components/HandlerSelectMenu.js';
import { HandlerButton } from './components/HandlerButton.js';
import { HandlerEmbed } from './components/HandlerEmbed.js';
import { Handler } from '../Handler.js';
import Bottleneck from 'bottleneck';
import { Stream } from 'stream';
import path from 'path';
import fs from 'fs';

export class HandlerReplies {

    public createEmbedTemplate(context?: Interaction | Message): HandlerEmbed {
        const embed = new HandlerEmbed();
        if (context) embed.setContextAuthor(context);
        return embed;
    }

    public createButtonTemplate(): HandlerButton {
        return new HandlerButton();
    }

    public createSelectMenuTemplate(): HandlerSelectMenu {
        return new HandlerSelectMenu();
    }

    public createAttachmentTemplate(attachment: BufferResolvable | Stream, name?: string, data?: any): HandlerAttachment {
        return new HandlerAttachment(attachment, name, data);
    }

    public createAdminOrOwnerReply(context: Interaction | Message): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-5.png`);
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = this.createEmbedTemplate(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription(
                context instanceof BaseCommandInteraction ?
                    [
                        'Sorry! Only an admin can use this command',
                        '*If appropriate ask an adming to help!*'
                    ] : [
                        'Sorry! Only the creator of this interaction can use this component',
                        '*If possible try using the command for youself!*'
                    ]);
        return { embeds: [embed], files: [attachment], ephemeral: true }
    }

    public createErrorReply(context: Interaction | Message, error: any): InteractionReplyOptions {
        if (error instanceof Bottleneck.BottleneckError) return this.createBottleneckErrorReply(context, error);
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-7.png`);
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = new HandlerEmbed()
            .setContextAuthor(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I seem to have run into an unexpected issue with your request!`,
                `Error: *${error.message ?? error.name ?? 'unknown'}*`,
                '',
                'This error has been reported and will be fixed!'
            ]);
        console.warn('Unknown Error', error)
        return { embeds: [embed], files: [attachment] }
    }

    public createBottleneckErrorReply(context: Interaction | Message, error: Bottleneck.BottleneckError): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-7.png`);
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = new HandlerEmbed()
            .setContextAuthor(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setTitle(error.name)
            .setDescription([
                'Sorry! It appears I am being rate limited',
                `Message: *${error.message}*`,
                '',
                '*Please give me some time before trying again!*'
            ]);
        console.warn('Unknown Error', error)
        return { embeds: [embed], files: [attachment] }
    }

    // OLD

    public static createMessageContentReply(context: Interaction | Message, action: string): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-2.png`);
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = new HandlerEmbed()
            .setContextAuthor(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! It looks like that message has no content to ${action}`,
                `*Please make the correct changes before trying again!*`
            ].join('\n'));
        return { embeds: [embed], files: [attachment], ephemeral: true }
    }

    public static createInvalidInputReply(context: Interaction | Message, message: string): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-2.png`);
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = new HandlerEmbed()
            .setContextAuthor(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! ${message ?? 'It looks like that input is invalid'}`,
                `*Please make the correct changes before trying again!*`
            ].join('\n'));
        return { embeds: [embed], files: [attachment], ephemeral: true }
    }

    public static createAdminOrOwnerReply(context: Interaction | Message): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-5.png`);
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = new HandlerEmbed()
            .setContextAuthor(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! Only the creator of this interaction can use this component`,
                `*If possible try using the command for youself!*`
            ].join('\n'));
        return { embeds: [embed], files: [attachment], ephemeral: true }
    }

    public static createNotFoundReply(context: Interaction | Message, query: string, message?: string): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-3.png`);
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = new HandlerEmbed()
            .setContextAuthor(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I could not find \`${query}\``,
                `*${message ?? 'Please check your spelling or try again later!'}*`
            ].join('\n'));
        return { embeds: [embed], files: [attachment] }
    }

    public static createUnexpectedErrorReply(context: Interaction | Message, handler: Handler<any>, message?: string): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-7.png`);
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = new HandlerEmbed()
            .setContextAuthor(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I seem to have run into an unexpected issue with \`${handler.toString()}\``,
                `*${message ?? 'This error has been reported and will be fixed!'}*`
            ]);
        return { embeds: [embed], files: [attachment] }
    }

    public static createAPIErrorReply(context: Interaction | Message, handler: Handler<any>, message?: string): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-7.png`);
        const attachment = new HandlerAttachment(buffer, 'floorbot.png');
        const embed = new HandlerEmbed()
            .setContextAuthor(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I seem to have run into an unexpected api error with \`${handler.toString()}\``,
                `*${message ?? 'This error has been reported and will be fixed!'}*`
            ]);
        return { embeds: [embed], files: [attachment] }
    }
}
