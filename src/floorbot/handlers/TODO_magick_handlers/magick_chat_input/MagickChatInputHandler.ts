import { ChatInputCommandInteraction, Interaction, Message, MessageComponentInteraction, SelectMenuInteraction } from 'discord.js';
import { ImageMagickCLIAction, MagickProgress } from '../../../../lib/tools/image-magick/ImageMagickCLIAction.js';
import { ResponseOptions } from '../../../../lib/discord/builders/ReplyBuilder.js';
import { MagickChatInputCommandData } from './MagickChatInputCommandData.js';
import { HandlerUtil } from '../../../../lib/discord/HandlerUtil.js';
import { ChatInputCommandHandler } from 'discord.js-handlers';
import { MagickReplyBuilder } from '../MagickReplyBuilder.js';
import probe, { ProbeResult } from 'probe-image-size';
import { MagickUtil } from '../MagickUtil.js';

export class MagickChatInputHandler extends ChatInputCommandHandler {

    private readonly actions: { [index: string]: ImageMagickCLIAction; };

    constructor(path: string) {
        super(MagickChatInputCommandData);

        this.actions = MagickUtil.makeActions(path);
    }

    public async run(command: ChatInputCommandInteraction<'cached'>): Promise<any> {
        await command.deferReply();
        const input = command.options.getString('image', true);
        const resolvedUser = HandlerUtil.resolveUser(command, input, true);
        const resolvedEmoji = HandlerUtil.resolveEmoji(input);
        const metadata = await probe(
            !resolvedUser && !resolvedEmoji ? input : resolvedUser ?
                resolvedUser.displayAvatarURL() :
                resolvedEmoji!.imageURL
        ).catch(() => null);
        if (!metadata) {
            const replyOptions = new MagickReplyBuilder(command).addMagickNoImageEmbed(input);
            return command.followUp(replyOptions);
        }

        const response = await this.fetchMagickResponse(command, metadata);
        const message = await command.followUp(response);

        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
        collector.on('collect', async (component: MessageComponentInteraction<'cached'>) => {
            if (component.isSelectMenu()) {
                if (!HandlerUtil.isAdminOrOwner(component.member, command)) return component.reply(new MagickReplyBuilder(component).addAdminOrOwnerEmbed());
                await component.deferUpdate();
                const action = this.actions[component.values[0]!]!;
                const metadata = (await probe(message.embeds[0]!.image!.url!).catch(() => null))!;
                const replyOptions = new MagickReplyBuilder(component).addMagickProgressEmbed(metadata, action, {});
                await message.edit(replyOptions);
                await message.removeAttachments();
                const response = await this.fetchMagickResponse(component, metadata, action, message);
                await message.edit(response);
            }
        });
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    private async fetchMagickResponse(interaction: Interaction, metadata: ProbeResult, action?: ImageMagickCLIAction, message?: Message): Promise<ResponseOptions> {

        // Need to convert SVG files since they dont embed
        if (metadata.type === 'svg') {
            metadata.type = 'png';
            if (!action) action = this.actions['HUGEMOJI'];
        }

        // Command first used and not SVG
        if (!action) return new MagickReplyBuilder(interaction).addMagickImageEmbed({ metadata: metadata, actions: this.actions });

        let updateTime = 0; // First update will always post
        return action.run(metadata, (progress: MagickProgress) => {
            const now = Date.now();
            if ((updateTime + 1000) <= now) {
                updateTime = now;
                if (!(interaction instanceof SelectMenuInteraction)) return;
                const replyOptions = new MagickReplyBuilder(interaction).addMagickProgressEmbed(metadata, action!, progress);
                if (message) message.edit(replyOptions).catch(HandlerUtil.handleErrors(this));
            }
        }).then((buffer: Buffer) => {
            const newMetadata = probe.sync(buffer)!;
            const replyOptions = new MagickReplyBuilder(interaction).addMagickImageEmbed({ metadata: newMetadata, action: action, actions: this.actions, buffer: buffer });
            return replyOptions;
        }).catch((_reason) => {
            return new MagickReplyBuilder(interaction).addMagickFailedEmbed(metadata, action!);
        });
    }
}
