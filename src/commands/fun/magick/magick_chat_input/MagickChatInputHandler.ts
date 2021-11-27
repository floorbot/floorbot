import { CommandInteraction, Interaction, InteractionReplyOptions, Message, MessageComponentInteraction, SelectMenuInteraction } from 'discord.js';
import { ImageMagickCLIAction, MagickProgress } from '../../../../clis/image-magick/ImageMagickCLIAction.js';
import { ChatInputHandler } from '../../../../discord/handlers/abstracts/ChatInputHandler.js';
import { MagickChatInputCommandData } from './MagickChatInputCommandData.js';
import { HandlerUtil } from '../../../../discord/HandlerUtil.js';
import probe, { ProbeResult } from 'probe-image-size';
import { MagickReplies } from '../MagickReplies.js';
import { MagickUtil } from '../MagickUtil.js';

export class MagickChatInputHandler extends ChatInputHandler {

    private readonly actions: { [index: string]: ImageMagickCLIAction };
    private readonly replies: MagickReplies;

    constructor(path: string) {
        super({ group: 'Fun', global: false, nsfw: false, data: MagickChatInputCommandData });

        this.actions = MagickUtil.makeActions(path)
        this.replies = new MagickReplies();
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {
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
            const replyOptions = this.replies.createNoImageReply(command, input);
            return command.followUp(replyOptions);
        }

        const response = await this.fetchMagickResponse(command, metadata);
        const message = await command.followUp(response);

        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
        collector.on('collect', async (component: MessageComponentInteraction<'cached'>) => {
            if (component.isSelectMenu()) {
                if (!HandlerUtil.isAdminOrOwner(component.member, command)) return component.reply(this.replies.createAdminOrOwnerReply(component));
                await component.deferUpdate();
                const action = this.actions[component.values[0]!]!;
                const metadata = (await probe(message.embeds[0]!.image!.url!).catch(() => null))!;
                const replyOptions = this.replies.createProgressReply(component, metadata, action, {});
                await message.edit(replyOptions);
                await message.removeAttachments();
                const response = await this.fetchMagickResponse(component, metadata, action, message);
                await message.edit(response);
            }
        });
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    private async fetchMagickResponse(interaction: Interaction, metadata: ProbeResult, action?: ImageMagickCLIAction, message?: Message): Promise<InteractionReplyOptions> {

        // Need to convert SVG files since they dont embed
        if (metadata.type === 'svg') {
            metadata.type = 'png';
            if (!action) action = this.actions['HUGEMOJI'];
        }

        // Command first used and not SVG
        if (!action) return this.replies.createImageReply(interaction, { metadata: metadata, actions: this.actions });

        let updateTime = 0; // First update will always post
        return action.run(metadata, (progress: MagickProgress) => {
            const now = Date.now();
            if ((updateTime + 1000) <= now) {
                updateTime = now;
                if (!(interaction instanceof SelectMenuInteraction)) return;
                const replyOptions = this.replies.createProgressReply(interaction, metadata, action!, progress);
                if (message) message.edit(replyOptions).catch(HandlerUtil.handleErrors(this))
            }
        }).then((buffer: Buffer) => {
            const newMetadata = probe.sync(buffer)!;
            const replyOptions = this.replies.createImageReply(interaction, { metadata: newMetadata, action: action, actions: this.actions, buffer: buffer });
            return replyOptions;
        }).catch((_reason) => {
            return this.replies.createFailedEmbed(interaction, metadata, action!);
        });
    }
}
