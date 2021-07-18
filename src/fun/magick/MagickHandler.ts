import { ApplicationCommandData, CommandInteraction, GuildChannel, Message, SelectMenuInteraction, InteractionReplyOptions } from 'discord.js';
import { CommandClient, BaseHandler, CommandHandler, HandlerContext, SelectMenuHandler, Resolver, ResolverType } from 'discord.js-commands';
import { MagickAction, MagickProgress } from './MagickConstants';
import { MagickCommandData } from './MagickCommandData';
import CacheMap from 'cache-map.js';

import { MagickSelectMenu, MagickSelectMenuData } from './message/MagickSelectMenu'
import { MagickAttachment } from './message/MagickAttachment';
import { MagickEmbed } from './message/MagickEmbed';
import { ImageMagick } from './tool/ImageMagick';

import * as probe from 'probe-image-size';

export class MagickHandler extends BaseHandler implements CommandHandler, SelectMenuHandler {

    public readonly commandData: ApplicationCommandData;
    public readonly isGlobal: boolean;

    private readonly cache: CacheMap<GuildChannel, { readonly message: Message } & probe.ProbeResult>;

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

        await interaction.deferUpdate()
        const { message } = <{ message: Message }>interaction;
        const action = MagickAction[interaction.values[0]];
        const metadata = (await probe(interaction.message.embeds[0].image!.url!).catch(() => null))!;
        const embed = MagickEmbed.getProgressEmbed(interaction, metadata, action, {});
        await message.edit({ embeds: [embed], components: [], files: [] });
        await message.removeAttachments();

        const response = await this.fetchMagickResponse(interaction, metadata, action);
        return message.edit(response);
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        const { channel } = <{ channel: GuildChannel }>interaction;
        await interaction.defer();

        if (interaction.options.has('image')) {
            const input = <string>interaction.options.get('image')!.value;
            const resolved = await Resolver.resolve(interaction, [ResolverType.USER, ResolverType.EMOJI], input);
            const metadata = await probe(
                !resolved.user && !resolved.emoji ? input : resolved.user ?
                    resolved.user.displayAvatarURL({ dynamic: true }) :
                    resolved.emoji!.imageURL
            ).catch(() => null);
            const response = !metadata ?
                MagickEmbed.getInvalidInputEmbed(interaction, input).toReplyOptions() :
                await this.fetchMagickResponse(interaction, metadata);
            return interaction.followUp(response);
        }

        const metadata = this.cache.get(channel);
        const response = !metadata ?
            MagickEmbed.getMissingCacheEmbed(interaction, channel).toReplyOptions() :
            await this.fetchMagickResponse(interaction, metadata);
        return interaction.followUp(response);
    }

    private async fetchMagickResponse(context: HandlerContext, metadata: probe.ProbeResult, action?: MagickAction): Promise<InteractionReplyOptions> {

        // Need to convert SVG files since they dont embed
        if (metadata.type === 'svg') {
            metadata.type = 'png';
            if (!action) action = MagickAction.HUGEMOJI;
        }

        // Command first used and not SVG
        if (!action) {
            const embed = MagickEmbed.getImageEmbed(context, metadata);
            const actionRow = new MagickSelectMenu(context, action).asActionRow();
            return { embeds: [embed], components: [actionRow] };
        }

        let updateTime = 0;
        const progress: MagickProgress = {};
        return ImageMagick.execute(
            action.getArgs(metadata),
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
                            const embed = MagickEmbed.getProgressEmbed(context, metadata, action!, progress);
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
            const newMetadata = probe.sync(buffer)!;
            const actionRow = new MagickSelectMenu(context, action).asActionRow();
            const attachment = new MagickAttachment(buffer, action!, newMetadata);
            const embed = MagickEmbed.getImageEmbed(context, attachment);
            return { embeds: [embed], components: [actionRow], files: [attachment] };
        }).catch((_reason) => {
            const embed = MagickEmbed.getFailedEmbed(context, metadata, action!)
            return { embeds: [embed], components: [] };
        });
    }

    private async onMessage(message: Message) {
        const channel = message.channel;
        if (channel instanceof GuildChannel) {
            const existing = this.cache.get(channel);
            if (existing && (existing.message.deleted || existing.message.createdTimestamp > message.createdTimestamp)) return;

            // embed[].thumbnail & embed[].image
            message.embeds.forEach(async embed => {
                if (embed.thumbnail && embed.thumbnail.url) {
                    const metadata = await probe(embed.thumbnail.url).catch(() => null);
                    if (metadata) this.cache.set(channel, { message, ...metadata });
                }
                if (embed.image && embed.image.url) {
                    const metadata = await probe(embed.image.url).catch(() => null);
                    if (metadata) this.cache.set(channel, { message, ...metadata });
                }
            });

            // attachments[].url
            message.attachments.forEach(async attachment => {
                const metadata = await probe(attachment.url).catch(() => null);
                if (metadata) this.cache.set(channel, { message, ...metadata });
            });
        }
    }
}
