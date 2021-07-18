import { ApplicationCommandData, CommandInteraction, GuildChannel, Message, SelectMenuInteraction, InteractionReplyOptions } from 'discord.js';
import { CommandClient, BaseHandler, CommandHandler, HandlerContext, SelectMenuHandler, Resolver, ResolverType } from 'discord.js-commands';
import { MagickImageType, ImageData, MagickAction, MagickProgress } from './MagickConstants';
import { MagickCommandData } from './MagickCommandData';
import CacheMap from 'cache-map.js';

import { MagickSelectMenu, MagickSelectMenuData } from './message/MagickSelectMenu'
import { MagickAttachment } from './message/MagickAttachment';
import { MagickEmbed } from './message/MagickEmbed';
import { ImageMagick } from './tool/ImageMagick';


export class MagickHandler extends BaseHandler implements CommandHandler, SelectMenuHandler {

    public readonly commandData: ApplicationCommandData;
    public readonly isGlobal: boolean;

    private readonly cache: CacheMap<GuildChannel, { readonly message: Message } & ImageData>;

    constructor(client: CommandClient) {
        super(client, { id: 'magick', name: 'Magick', group: 'Fun', nsfw: false });
        this.commandData = MagickCommandData;
        this.isGlobal = false;
        this.cache = new CacheMap({ ttl: 1000 * 60 * 60 * 2 }); // 2 hour ttl
        this.client.on('messageCreate', (message) => this.onMessage(message));
        this.client.on('messageUpdate', (_oldMessage, newMessage) => this.onMessage(<Message>newMessage));
    }

    public async onSelectMenu(interaction: SelectMenuInteraction, customData: any): Promise<any> {
        const data = <MagickSelectMenuData>customData;
        if (data.wl && data.wl !== interaction.user.id) {
            const embed = MagickEmbed.getWhitelistEmbed(interaction);
            return interaction.reply({ embeds: [embed], ephemeral: true })
        }

        const { message } = <{ message: Message }>interaction;
        const action = MagickAction[interaction.values[0]];
        const image = MagickHandler.getImageData(interaction.message.embeds[0].image!.url!)!;
        const embed = MagickEmbed.getProgressEmbed(interaction, image, action, {});
        await interaction.update({ embeds: [embed], components: [], files: [] })
        // await message.removeAttachments();

        const response = await this.fetchMagickResponse(interaction, image, action);
        return message.edit(response);
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        const { channel } = <{ channel: GuildChannel }>interaction;
        await interaction.defer();

        if (interaction.options.has('image')) {
            const input = <string>interaction.options.get('image')!.value;
            const resolved = await Resolver.resolve(interaction, [ResolverType.USER, ResolverType.EMOJI], input);
            const image = MagickHandler.getImageData(
                !resolved.user && !resolved.emoji ? input : resolved.user ?
                    resolved.user.displayAvatarURL({ dynamic: true }) :
                    resolved.emoji!.imageURL
            );
            const response = !image ?
                MagickEmbed.getInvalidInputEmbed(interaction, input).toReplyOptions() :
                await this.fetchMagickResponse(interaction, image);
            return interaction.followUp(response);
        }

        const image = this.cache.get(channel);
        const response = !image ?
            MagickEmbed.getMissingCacheEmbed(interaction, channel).toReplyOptions() :
            await this.fetchMagickResponse(interaction, image);
        return interaction.followUp(response);
    }

    private async fetchMagickResponse(context: HandlerContext, image: ImageData, action?: MagickAction): Promise<InteractionReplyOptions> {

        // Need to convert SVG files since they dont embed
        if (image.type === MagickImageType.SVG) {
            image = { url: image.url, type: MagickImageType.PNG }
            if (!action) action = MagickAction.HUGEMOJI;
        }

        // Command first used and not SVG
        if (!action) {
            const embed = MagickEmbed.getImageEmbed(context, image);
            const actionRow = new MagickSelectMenu(context, action).asActionRow();
            return { embeds: [embed], components: [actionRow] };
        }

        let updateTime = 0;
        const progress: MagickProgress = {};
        return ImageMagick.execute(
            action.getArgs(image),
            (reject, string) => {
                string = string.toLowerCase();
                const part = string.split(' ')[0];
                switch (part) {
                    case 'classify':
                    case 'threshold':
                    case 'mogrify':
                    case 'dither':
                    case 'reduce':
                    case 'resize':
                    case 'encode':
                    case 'save':
                        if (!(context instanceof SelectMenuInteraction)) break;
                        if (!progress[part]) progress[part] = { percent: 0, counter: 0 }
                        const percent = Number(string.match(/(\d+)(?:%)/)![1]);
                        if (percent === 100) progress[part].counter = progress[part].counter + 1;
                        progress[part].percent = percent;
                        const now = Date.now();
                        if ((updateTime + 1000) <= now) {
                            updateTime = now;
                            const message = <Message>context.message;
                            const embed = MagickEmbed.getProgressEmbed(context, image, action!, progress);
                            message.edit({ embeds: [embed], components: [] })
                        }
                        break;
                    default:
                        if (/^(?:\r\n|\r|\n)$/.test(string) || string.startsWith('mogrify')) break;
                        context.client.emit('log', `[magick] Failed for an unknown reason: <${string}>`);
                        return reject(string);
                }
            }
        ).then((buffer: any) => {
            const actionRow = new MagickSelectMenu(context, action).asActionRow();
            const attachment = new MagickAttachment(buffer, action!, image);
            const embed = MagickEmbed.getImageEmbed(context, attachment);
            return { embeds: [embed], components: [actionRow], files: [attachment] };
        }).catch((_reason) => {
            const embed = MagickEmbed.getFailedEmbed(context, image, action!)
            return { embeds: [embed], components: [] };
        });
    }

    private onMessage(message: Message) {
        const channel = message.channel;
        if (channel instanceof GuildChannel) {
            const existing = this.cache.get(channel);
            if (existing && (existing.message.deleted || existing.message.createdTimestamp > message.createdTimestamp)) return;
            // content
            const contentImage = MagickHandler.getImageData(message.content);
            if (contentImage) this.cache.set(channel, { message, ...contentImage });

            // embed[].thumbnail & embed[].image
            message.embeds.forEach(embed => {
                if (embed.thumbnail && embed.thumbnail.url) {
                    const thumbnailURL = MagickHandler.getImageData(embed.thumbnail.url);
                    if (thumbnailURL) this.cache.set(channel, { message, ...thumbnailURL });
                }
                if (embed.image && embed.image.url) {
                    const imageURL = MagickHandler.getImageData(embed.image.url);
                    if (imageURL) this.cache.set(channel, { message, ...imageURL });
                }
            });

            // attachments[].url
            message.attachments.forEach(attachment => {
                const attachmentImage = MagickHandler.getImageData(attachment.url);
                if (attachmentImage) this.cache.set(channel, { message, ...attachmentImage });
            });
        }
    }

    private static getImageData(text: string): ImageData | null {
        const typeString = Object.values(MagickImageType).join('|');
        const urlRegex = new RegExp(`(http(s?):)([^\\s])*\\.(?:${typeString})`, 'g');
        const urlMatches = text.match(urlRegex);
        if (!urlMatches) return null;
        const url = urlMatches.pop()!

        const typeRegex = new RegExp(`(?:\\.)(${typeString})(?:.+)?$`);
        const typeMatches = url.match(typeRegex)!;
        const type = <MagickImageType>(typeMatches[1].toLowerCase());

        return { url, type };
    }
}
