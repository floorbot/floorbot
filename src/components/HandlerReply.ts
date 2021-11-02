import { HandlerAttachment } from './HandlerAttachment';
import { InteractionReplyOptions } from 'discord.js';
import { HandlerContext } from '../discord/Util';
import { HandlerEmbed } from './HandlerEmbed';
import { Handler } from '../discord/Handler';
import * as fs from 'fs';

export class HandlerReply {

    public static createMessageContentReply(context: HandlerContext, action: string): InteractionReplyOptions {
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

    public static createInvalidInputReply(context: HandlerContext, message: string): InteractionReplyOptions {
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

    public static createAdminOrOwnerReply(context: HandlerContext): InteractionReplyOptions {
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

    public static createNotFoundReply(context: HandlerContext, query: string, message?: string): InteractionReplyOptions {
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

    public static createUnexpectedErrorReply(context: HandlerContext, handler: Handler, message?: string): InteractionReplyOptions {
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

    public static createAPIErrorReply(context: HandlerContext, handler: Handler, message?: string): InteractionReplyOptions {
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
