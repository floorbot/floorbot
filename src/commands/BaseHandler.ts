import { AutocompleteInteraction, BaseCommandInteraction, InteractionReplyOptions, Message, MessageEmbed } from 'discord.js';
import { HandlerAttachment } from '../components/HandlerAttachment';
import { Handler, HandlerOptions } from '../discord/Handler';
import { HandlerEmbed } from '../components/HandlerEmbed';
import { HandlerClient } from '../discord/HandlerClient';
import { HandlerContext } from '../discord/Util';
import * as fs from 'fs';

export abstract class BaseHandler extends Handler {

    constructor(options: HandlerOptions) {
        const description = options.description ?? ('description' in options.data ? options.data.description : options.description);
        super({ ...options, description });
    }

    public autocomplete(_interaction: AutocompleteInteraction): Promise<any> {
        throw `Autocomplete not supported for ${this.id} handler`;
    }

    public override async setup(client: HandlerClient): Promise<any> {
        if (this.global) {
            const commands = await client.fetchCommands(this);
            if (!commands.length) {
                const appCommand = await client.postCommand(this);
                client.emit('log', `[setup](${this.id}) Posted missing global command to discord <${appCommand.id}>`)
                if (this.permissions.length) {
                    await appCommand.permissions.add({ permissions: this.permissions });
                    client.emit('log', `[setup](${this.id}) Posted default permissions to discord for <${appCommand.id}>`)
                }
            }
        }
    }

    protected createEnderFunction(message: Message) {
        return async () => {
            try {
                const replyOptions: InteractionReplyOptions = {
                    ...(message.content ? { content: message.content } : {}),
                    embeds: message.embeds,
                    components: [],
                    attachments: [...message.attachments.values()]
                };
                if (replyOptions.embeds && replyOptions.embeds.length) {
                    if (replyOptions.embeds[0] ?.footer ?.text ?.length) replyOptions.embeds[0].footer.text += ' - 🔒 Locked';
                    else (replyOptions.embeds[0] as MessageEmbed).setFooter('🔒 Locked');
                }
                await message.edit(replyOptions).catch(() => { });
            } catch { }
        }
    }

    public getNotFoundResponse(context: HandlerContext, query: any): InteractionReplyOptions {
        const buffer = fs.readFileSync(`${__dirname}/../../res/thumbnails/404.png`);
        const attachment = new HandlerAttachment(buffer, '404.png');
        const embed = this.getEmbedTemplate(context)
            .setContextAuthor(context)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I could not find \`${query}\``,
                '*Please check your spelling or try again later!*'
            ].join('\n'));
        return { embeds: [embed], files: [attachment] }
    }

    public getEmbedTemplate(context: HandlerContext): HandlerEmbed {
        return new HandlerEmbed().setContextAuthor(context);
    }

    public override onNSFW(interaction: BaseCommandInteraction): Promise<any> {
        const embed = this.getEmbedTemplate(interaction).setDescription([
            `Sorry! The \`${interaction.commandName}\` command can only be used in \`NSFW\` channels 😏`,
            '*Try a different channel or make this one NSFW if it is appropriate!*'
        ]);
        return interaction.reply(embed.toReplyOptions(false));
    }

    public override onError(interaction: BaseCommandInteraction): Promise<any> {
        const embed = this.getEmbedTemplate(interaction).setDescription([
            `Sorry! I seem to have run into an issue with your \`${interaction.commandName}\` command 😦`,
            `*The error has been reported and will be fixed in the future!*`
        ]);
        return interaction.reply(embed.toReplyOptions(false));
    }
}
