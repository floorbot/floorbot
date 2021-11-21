import { CommandInteraction, Interaction, InteractionReplyOptions, Message, MessageComponentInteraction, SelectMenuInteraction } from 'discord.js';
import { ChatInputHandler } from '../../../../discord/handler/abstracts/ChatInputHandler.js';
import { MagickChatInputCommandData } from './MagickChatInputCommandData.js';
import { HandlerUtil } from '../../../../discord/handler/HandlerUtil.js';
import { MagickAction, MagickProgress } from '../MagickConstants.js';
import { MagickSelectMenu } from '../components/MagickSelectMenu.js';
import { MagickAttachment } from '../components/MagickAttachment.js';
import { HandlerReplies } from '../../../../helpers/HandlerReplies.js';
import { MagickEmbed } from '../components/MagickEmbed.js';
import { ImageMagick } from '../tools/ImageMagick.js';
import probe from 'probe-image-size';

export class MagickChatInputHandler extends ChatInputHandler {

    constructor() {
        super({ group: 'Fun', global: false, nsfw: false, data: MagickChatInputCommandData });
    }

    public async execute(command: CommandInteraction): Promise<any> {
        await command.deferReply();
        const input = command.options.getString('image', true);
        const resolvedUser = HandlerUtil.resolveUser(command, input);
        const resolvedEmoji = HandlerUtil.resolveEmoji(input);
        const metadata = await probe(
            !resolvedUser && !resolvedEmoji ? input : resolvedUser ?
                resolvedUser.displayAvatarURL({ dynamic: true }) :
                resolvedEmoji!.imageURL
        ).catch(() => null);
        if (!metadata) {
            const embed = new MagickEmbed(command)
                .setDescription(`Sorry! \`${input}\` is not a valid image`);
            return command.followUp(embed.toReplyOptions({ ephemeral: true }));
        }
        const response = await this.fetchMagickResponse(command, metadata);
        let message = await command.followUp(response) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
        collector.on('collect', async (component: MessageComponentInteraction<'cached'>) => {
            if (component.isSelectMenu()) {
                if (!HandlerUtil.isAdminOrOwner(component.member, command)) return component.reply(HandlerReplies.createAdminOrOwnerReply(component))
                await component.deferUpdate();
                const action = MagickAction[component.values[0]!]!;
                const metadata = (await probe(message.embeds[0]!.image!.url!).catch(() => null))!;
                const embed = MagickEmbed.getProgressEmbed(component, metadata, action, {});
                await message.edit({ embeds: [embed], components: [], files: [] });
                await message.removeAttachments();
                const response = await this.fetchMagickResponse(component, metadata, action);
                message = await message.edit(response);
            }
        });
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    private async fetchMagickResponse(interaction: Interaction, metadata: probe.ProbeResult, action?: MagickAction): Promise<InteractionReplyOptions> {

        // Need to convert SVG files since they dont embed
        if (metadata.type === 'svg') {
            metadata.type = 'png';
            if (!action) action = MagickAction['HUGEMOJI'];
        }

        // Command first used and not SVG
        if (!action) {
            const embed = MagickEmbed.getImageEmbed(interaction, metadata);
            const actionRow = MagickSelectMenu.getMagickSelectMenu(action).toActionRow();
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
                        if (!(interaction instanceof SelectMenuInteraction)) break;
                        if (!progress[part]) progress[part] = { percent: 0, counter: 0 }
                        const percent = Number(string.match(/(\d+)(?:%)/)![1]);
                        if (percent === 100) progress[part]!.counter = progress[part]!.counter + 1;
                        progress[part]!.percent = percent;
                        const now = Date.now();
                        if ((updateTime + 1000) <= now) {
                            updateTime = now;
                            const message = interaction.message as Message;
                            const embed = MagickEmbed.getProgressEmbed(interaction, metadata, action!, progress);
                            message.edit({ embeds: [embed], components: [] })
                        }
                        break;
                    default:
                        if (/^(?:\r\n|\r|\n)$/.test(string) || string.startsWith('mogrify')) break;
                        interaction.client.emit('log', `[magick] Failed for an unknown reason: <${string}>`);
                        return reject(string);
                }
            }
        ).then((buffer: any) => {
            const newMetadata = probe.sync(buffer)!;
            const actionRow = MagickSelectMenu.getMagickSelectMenu(action).toActionRow();
            const attachment = MagickAttachment.getMagickAttachment(buffer, action!, newMetadata);
            const embed = MagickEmbed.getImageEmbed(interaction, attachment);
            return { embeds: [embed], components: [actionRow], files: [attachment] };
        }).catch((_reason) => {
            const embed = MagickEmbed.getFailedEmbed(interaction, metadata, action!)
            return { embeds: [embed], components: [] };
        });
    }
}
