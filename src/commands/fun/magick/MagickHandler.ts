import { GuildHandler, GuildHandlerGroup, MagickCustomData, MagickCommandData, ImageMagick, MagickEmbedFactory, MagickAction, MagickSelectMenuFactory, MagickAttachmentFactory, MagickProgress } from '../../..';
import { CommandInteraction, GuildChannel, Message, SelectMenuInteraction, InteractionReplyOptions, Util } from 'discord.js';
import { CommandClient, HandlerContext, HandlerResult, HandlerEmbed } from 'discord.js-commands';
import * as probe from 'probe-image-size';
import CacheMap from 'cache-map.js';

export class MagickHandler extends GuildHandler<MagickCustomData> {

    private readonly cache: CacheMap<GuildChannel, { readonly message: Message } & probe.ProbeResult>;

    constructor() {
        super({ id: 'magick', group: GuildHandlerGroup.FUN, commandData: MagickCommandData });
        this.cache = new CacheMap({ ttl: 1000 * 60 * 60 * 2 }); // 2 hour ttl
    }

    public override async onCommand(interaction: CommandInteraction): Promise<any> {
        const { channel } = <{ channel: GuildChannel }>interaction;
        await interaction.defer();
        const input = interaction.options.getString('image');
        if (input) {
            const resolvedUser = Util.resolveUser(interaction, input);
            const resolvedEmoji = Util.resolveEmoji(input);
            const metadata = await probe(
                !resolvedUser && !resolvedEmoji ? input : resolvedUser ?
                    resolvedUser.displayAvatarURL({ dynamic: true }) :
                    resolvedEmoji!.imageURL
            ).catch(() => null);
            const response = !metadata ?
                this.getInvalidInputResponse(interaction, input) :
                await this.fetchMagickResponse(interaction, metadata);
            return interaction.followUp(response);
        }

        const metadata = this.cache.get(channel);
        const response = !metadata ?
            MagickEmbedFactory.getMissingCacheEmbed(this, interaction, channel).toReplyOptions() :
            await this.fetchMagickResponse(interaction, metadata);
        return interaction.followUp(response);
    }

    public override async onSelectMenu(interaction: SelectMenuInteraction, _customData: MagickCustomData): Promise<any> {
        await interaction.deferUpdate()
        const { message } = <{ message: Message }>interaction;
        const action = MagickAction[interaction.values[0]!]!;

        const metadata = (await probe(interaction.message.embeds[0]!.image!.url!).catch(() => null))!;
        const embed = MagickEmbedFactory.getProgressEmbed(this, interaction, metadata, action, {});
        await message.edit({ embeds: [embed], components: [], files: [] });
        await message.removeAttachments();

        const response = await this.fetchMagickResponse(interaction, metadata, action);
        return message.edit(response);
    }

    public override getEmbedTemplate(context: HandlerContext, _customData?: MagickCustomData): HandlerEmbed {
        return super.getEmbedTemplate(context)
            .setFooter('Powered by ImageMagick', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/ImageMagick_logo.svg/1200px-ImageMagick_logo.svg.png');
    }

    private async fetchMagickResponse(context: HandlerContext, metadata: probe.ProbeResult, action?: MagickAction): Promise<InteractionReplyOptions> {

        // Need to convert SVG files since they dont embed
        if (metadata.type === 'svg') {
            metadata.type = 'png';
            if (!action) action = MagickAction['HUGEMOJI'];
        }

        // Command first used and not SVG
        if (!action) {
            const embed = MagickEmbedFactory.getImageEmbed(this, context, metadata);
            const actionRow = MagickSelectMenuFactory.getMagickSelectMenu(this, context, action).toActionRow();
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
                        if (percent === 100) progress[part]!.counter = progress[part]!.counter + 1;
                        progress[part]!.percent = percent;
                        const now = Date.now();
                        if ((updateTime + 1000) <= now) {
                            updateTime = now;
                            const message = <Message>context.message;
                            const embed = MagickEmbedFactory.getProgressEmbed(this, context, metadata, action!, progress);
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
            const actionRow = MagickSelectMenuFactory.getMagickSelectMenu(this, context, action).toActionRow();
            const attachment = MagickAttachmentFactory.getMagickAttachment(buffer, action!, newMetadata);
            const embed = MagickEmbedFactory.getImageEmbed(this, context, attachment);
            return { embeds: [embed], components: [actionRow], files: [attachment] };
        }).catch((_reason) => {
            const embed = MagickEmbedFactory.getFailedEmbed(this, context, metadata, action!)
            return { embeds: [embed], components: [] };
        });
    }

    public override async setup(client: CommandClient): Promise<HandlerResult> {
        client.on('messageCreate', (message) => this.onMessage(message));
        client.on('messageUpdate', (_oldMessage, newMessage) => this.onMessage(<Message>newMessage));
        return { message: 'Added message create and update listeners' };
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
