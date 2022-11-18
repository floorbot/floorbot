import { chatInputApplicationCommandMention, CommandInteraction, ComponentType, EmbedBuilder, MessageComponentInteraction } from 'discord.js';
import { HandlerContext } from 'discord.js-handlers';
import { ReplyBuilder } from '../../../discord/builders/ReplyBuilder.js';
import { AttachmentFactory, AvatarExpression } from '../../../floorbot/helpers/AttachmentFactory.js';
import { Util } from '../../../floorbot/helpers/Util.js';

export type ReplyEmbedBuilderOptions = { context?: HandlerContext, prefix?: string, suffix?: string; };

export class FloorbotReplyBuilder extends ReplyBuilder {

    public static AUTO_AUTHOR: boolean = false;

    /** This is a unique helper function for consistent embeds */
    public override createEmbedBuilder({ context, prefix, suffix }: ReplyEmbedBuilderOptions = {}): EmbedBuilder {
        const embed = new EmbedBuilder();
        if (context || this.context) {
            embed.setContextColor(context ?? this.context ?? null);
            if (FloorbotReplyBuilder.AUTO_AUTHOR) embed.setContextAuthor(context ?? this.context ?? null);
        }
        if (prefix) embed.setFooter({ text: prefix });
        if (suffix) embed.setAuthor({ name: suffix });
        return embed;
    }

    public override addEmbedMessage({ content }: { content: string; }): this {
        const embed = this.createEmbedBuilder()
            .setDescription(content);
        return this.addEmbeds(embed);
    }

    public override addGuildOnlyEmbed({ command }: { command?: CommandInteraction; } = {}): this {
        const attachment = AttachmentFactory.avatarExpression({ expression: AvatarExpression.Frown });
        const commandMention = command ? `${chatInputApplicationCommandMention(command.commandName, command.commandId)} ` : 'this feature';
        const embed = this.createEmbedBuilder({ suffix: 'Guild Only Command' })
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! It looks like I can only use ${commandMention} in guilds!`,
                '*Make sure you try using this in an appropriate guild!*'
            ].join('\n'));
        this.addEmbeds(embed);
        this.addFiles(attachment);
        this.setEphemeral();
        return this;
    }

    public override addAdminOrOwnerEmbed({ command, component }: { command?: CommandInteraction, component?: MessageComponentInteraction; } = {}): this {
        const attachment = AttachmentFactory.avatarExpression({ expression: AvatarExpression.Mad });
        const commandMention = command ? `${chatInputApplicationCommandMention(command.commandName, command.commandId)} ` : 'this feature';
        const componentType = component?.componentType ? ComponentType[component.componentType] ?? 'component' : 'component';
        const embed = this.createEmbedBuilder({ suffix: 'Admin or Owner Permission' })
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                ...(command && !component ? [
                    `Sorry! Only an admin can use ${commandMention}`,
                    '*If appropriate ask an admin to help!*'
                ] : [
                    `Sorry! Only the original command author can use this \`${Util.lowercaseString(componentType)}\``,
                    `*If possible you can try using ${commandMention ?? 'the command'} for yourself!*`
                ])
            ].join('\n'));
        this.addEmbeds(embed);
        this.addFiles(attachment);
        this.setEphemeral();
        return this;
    }

    public override addUnknownComponentEmbed({ component }: { component?: MessageComponentInteraction; } = {}): this {
        const componentType = component?.componentType ? ComponentType[component.componentType] ?? 'component' : 'component';
        if (component) console.warn(`[support] Unknown ${componentType} - <${component.customId}>`, component);
        const attachment = AttachmentFactory.avatarExpression({ expression: AvatarExpression.Sad });
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I'm not sure how to handle this \`${Util.lowercaseString(componentType)}\`...`,
                `*The issue has been reported and will be fixed in the future!*`
            ].join('\n'));
        this.addFiles(attachment);
        this.addEmbeds(embed);
        this.setEphemeral();
        return this;
    }

    public override addNotFoundEmbed({ query, message, command }: { query?: string | null, message?: string, command?: CommandInteraction; } = {}): this {
        const attachment = AttachmentFactory.avatarExpression({ expression: AvatarExpression.Frown });
        const commandMention = command ? `${chatInputApplicationCommandMention(command.commandName, command.commandId)} ` : '';
        const embed = this.createEmbedBuilder({ suffix: 'Not Found' })
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I could not find any ${commandMention}results for \`${query || 'your query'}\``,
                `*${message ?? 'Please check your spelling or try again later!'}*`
            ].join('\n'));
        this.addFiles(attachment);
        this.addEmbeds(embed);
        this.setEphemeral();
        return this;
    }

    public override addUnexpectedErrorEmbed({ error }: { error?: any; } = {}): this {
        if (error) console.error('[error] Unexpected Error', error);
        const attachment = AttachmentFactory.avatarExpression({ expression: AvatarExpression.SadTears });
        const embed = this.createEmbedBuilder({ suffix: 'Unexpected Error' })
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I seem to have run into an unexpected error processing your request...`,
                `*The error has been reported and will be fixed in the future!*`,
                '',
                ...(typeof error === 'string' ? [`Message: \`${error}\``] : []),
                ...(error && error.message ? [`Message: \`${error.message}\``] : [])
            ].join('\n'));
        this.addFiles(attachment);
        this.addEmbeds(embed);
        this.setEphemeral(true);
        return this;
    }
}

declare module '../../../discord/builders/ReplyBuilder' {
    export interface ReplyBuilder {
        createEmbedBuilder({ context, prefix, suffix }?: ReplyEmbedBuilderOptions): EmbedBuilder;
        addEmbedMessage({ content }: { content: string; }): this;
        addGuildOnlyEmbed({ command }?: { command?: CommandInteraction; }): this;
        addAdminOrOwnerEmbed({ command, component }: { command?: CommandInteraction, component?: MessageComponentInteraction; }): this;
        addUnknownComponentEmbed({ component }: { component?: MessageComponentInteraction; }): this;
        addNotFoundEmbed({ query, message, command }: { query?: string | null, message?: string, command?: CommandInteraction; }): this;
        addUnexpectedErrorEmbed({ error }: { error?: any; }): this;
    }
};

ReplyBuilder.prototype.createEmbedBuilder = FloorbotReplyBuilder.prototype.createEmbedBuilder;
ReplyBuilder.prototype.addEmbedMessage = FloorbotReplyBuilder.prototype.addEmbedMessage;
ReplyBuilder.prototype.addGuildOnlyEmbed = FloorbotReplyBuilder.prototype.addGuildOnlyEmbed;
ReplyBuilder.prototype.addAdminOrOwnerEmbed = FloorbotReplyBuilder.prototype.addAdminOrOwnerEmbed;
ReplyBuilder.prototype.addUnknownComponentEmbed = FloorbotReplyBuilder.prototype.addUnknownComponentEmbed;
ReplyBuilder.prototype.addNotFoundEmbed = FloorbotReplyBuilder.prototype.addNotFoundEmbed;
ReplyBuilder.prototype.addUnexpectedErrorEmbed = FloorbotReplyBuilder.prototype.addUnexpectedErrorEmbed;
