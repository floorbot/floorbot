import { ApplicationCommandData, CommandInteraction, GuildChannel, Message, MessageActionRow, MessageSelectMenu, MessageAttachment, SelectMenuInteraction, InteractionReplyOptions, MessageEmbed } from 'discord.js';
import { CommandClient, BaseHandler, CommandHandler, HandlerContext, SelectMenuHandler, Resolver, ResolverType } from 'discord.js-commands';
import { MagickImageType, ImageData, MagickAction } from './MagickConstants';
import { MagickCommandData } from './MagickCommandData';
import CacheMap from 'cache-map.js';

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
        if (customData.wl && customData.wl !== interaction.user.id) {
            return interaction.reply({
                embeds: [new MessageEmbed().setDescription('Sorry only the author can choose a process')],
                ephemeral: true
            })
        }
        await interaction.deferUpdate();
        const process = MagickAction[interaction.values[0]];
        const image = MagickHandler.getImageData(interaction.message.embeds[0].image!.url!)!;
        const response = await this.fetchMagickResponse(interaction, image, process);
        const { message } = <{ message: Message }>interaction;
        await message.removeAttachments();
        return message.edit(response);
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        const { channel } = <{ channel: GuildChannel }>interaction;
        await interaction.defer();

        if (interaction.options.has('image')) {
            const input = <string>interaction.options.get('image')!.value;
            const resolved = await Resolver.resolve(interaction, [ResolverType.USER, ResolverType.EMOJI], input);
            if (!resolved.user && !resolved.emoji) {
                const image = MagickHandler.getImageData(input);
                if (!image) return interaction.followUp({ content: `Sorry but I dont think \`${input}\` is an image` });
                const response = await this.fetchMagickResponse(interaction, image);
                return interaction.followUp(response);
            }
            const image = MagickHandler.getImageData(resolved.user ?
                resolved.user.displayAvatarURL({ dynamic: true }) :
                resolved.emoji!.imageURL
            )!;
            const response = await this.fetchMagickResponse(interaction, image);
            return interaction.followUp(response);
        }

        const image = this.cache.get(channel);
        if (!image) return interaction.followUp({ content: `Sorry but there are not cached images for ${channel}` });
        const response = await this.fetchMagickResponse(interaction, image);
        return interaction.followUp(response);
    }

    private async fetchMagickResponse(context: HandlerContext, image: ImageData, process?: MagickAction): Promise<InteractionReplyOptions> {

        // Need to convert SVG files since they dont embed
        if (image.type === MagickImageType.SVG) {
            image = { url: image.url, type: MagickImageType.PNG }
            if (!process) process = MagickAction.HUGEMOJI;
        }

        const embed = this.getEmbedTemplate(context)
            .setImage(image.url)
            .setURL(image.url)
            .setTitle('Original Image');
        const actionRow = new MessageActionRow().addComponents([
            new MessageSelectMenu()
                .setPlaceholder('Select a process to apply to the image')
                .setCustomId(JSON.stringify({ id: 'magick', wl: context.member!.user.id }))
                .addOptions(Object.entries(MagickAction).map(action => {
                    return {
                        label: action[1].label,
                        value: action[0],
                        default: action[1] === process,
                        description: action[1].description
                    }
                }))
        ]);
        if (!process) return { embeds: [embed], components: [actionRow] };
        let updateTime = 0;
        const stats: { [index: string]: { progress: number, counter: number } } = {};
        return ImageMagick.execute(
            process.getArgs(image),
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
                        if (!stats[part]) stats[part] = { progress: 0, counter: 0 }
                        const progress = Number(string.match(/(\d+)(?:%)/)![1]);
                        if (progress === 100) stats[part].counter = stats[part].counter + 1;
                        stats[part].progress = progress;
                        const now = Date.now();
                        if ((updateTime + 1000) <= now) {
                            updateTime = now;
                            const message = <Message>context.message;
                            const progressEmbed = new MessageEmbed()
                                .setTitle(`Please wait for ${process!.label}`)
                                .setThumbnail(image.url)
                                .setDescription(Object.entries(stats).map(ent => {
                                    const progressBar = new Array(11).fill('▬');
                                    progressBar[Math.floor((<any>ent[1]).progress / 10)] = '🟢';
                                    return `${progressBar.join('')} [${(<any>ent[1]).progress}%] ${ent[0]}: ${(<any>ent[1]).counter}`
                                }).join('\n'));
                            message.edit({ embeds: [progressEmbed], components: [] })
                        }
                        break;
                    default:
                        if (/^(?:\r\n|\r|\n)$/.test(string) || string.startsWith('mogrify')) break;
                        context.client.emit('log', `[magick] Failed for an unknown reason: <${string}>`);
                        return reject(string);
                }
            }
        ).then((buffer: any) => {
            const file = new MessageAttachment(buffer, `${process!.label}.${image.type}`);
            embed.setImage(`attachment://${process!.label}.${image.type}`)
                .setTitle(`${process!.label} Original`);
            return { embeds: [embed], components: [actionRow], files: [file] };
        }).catch((_reason) => {
            const errorEmbed = this.getEmbedTemplate(context)
                .setThumbnail(image.url)
                .setDescription(`Sorry it looks like I ran into an issue with \`${process!.label}\``)
            return { embeds: [errorEmbed], components: [] };
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
