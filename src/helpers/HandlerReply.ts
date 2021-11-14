import { HandlerAttachment } from '../discord/components/HandlerAttachment.js';
import { Interaction, InteractionReplyOptions, Message } from 'discord.js';
import { HandlerEmbed } from '../discord/components/HandlerEmbed.js';
import { Handler } from '../discord/handler/Handler.js';
import fs from 'fs';

export class HandlerReply {

    public static createMessageContentReply(context: Interaction | Message, action: string): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${__dirname}/../../res/avatars/2-2.png`);
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
        const buffer = fs.readFileSync(`${__dirname}/../../res/avatars/2-2.png`);
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
        const buffer = fs.readFileSync(`${__dirname}/../../res/avatars/2-5.png`);
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
        const buffer = fs.readFileSync(`${__dirname}/../../res/avatars/2-3.png`);
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
        const buffer = fs.readFileSync(`${__dirname}/../../res/avatars/2-7.png`);
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
        const buffer = fs.readFileSync(`${__dirname}/../../res/avatars/2-7.png`);
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
