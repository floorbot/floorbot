import { ImageMagickCLIActionLiquidscale } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionLiquidscale.js';
import { ImageMagickCLIActionGreyscale } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionGreyscale.js';
import { ImageMagickCLIActionEightBit } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionEightBit.js';
import { ImageMagickCLIActionHugemoji } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionHugemoji.js';
import { ImageMagickCLIActionPixelate } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionPixelate.js';
import { ImageMagickCLIActionCartoon } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionCartoon.js';
import { ImageMagickCLIActionDeepfry } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionDeepFry.js';
import { ImageMagickCLIActionReverse } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionReverse.js';
import { ImageMagickCLIActionSketch } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionSketch.js';
import { ImageMagickCLIActionPetPet } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionPetPet.js';
import { ImageMagickCLIActionHyper } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionHyper.js';
import { ImageMagickCLIActionJPEG } from '../../../lib/tools/image-magick/actions/ImageMagickCLIActionJPEG.js';
import { ImageMagickCLIAction, MagickProgress } from '../../../lib/tools/image-magick/ImageMagickCLIAction.js';
import { ApplicationCommandData, CommandInteraction, Interaction, Message } from 'discord.js';
import { ResponseOptions } from '../../../lib/discord/builders/ReplyBuilder.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import { DiscordUtil } from '../../../lib/discord/DiscordUtil.js';
import { ApplicationCommandHandler } from 'discord.js-handlers';
import { MagickReplyBuilder } from './MagickReplyBuilder.js';
import probe, { ProbeResult } from 'probe-image-size';
import { APIMessage } from 'discord-api-types/v10';

export abstract class MagickHandler<I extends CommandInteraction, T extends ApplicationCommandData> extends ApplicationCommandHandler<I, T> {

    protected readonly actions: { [index: string]: ImageMagickCLIAction; };

    constructor(commandData: T, path?: string) {
        super(commandData);
        this.actions = {
            ['CARTOON']: new ImageMagickCLIActionCartoon(path),
            ['DEEPFRY']: new ImageMagickCLIActionDeepfry(path),
            ['EIGHT_BIT']: new ImageMagickCLIActionEightBit(path),
            ['GREYSCALE']: new ImageMagickCLIActionGreyscale(path),
            ['HUGEMOJI']: new ImageMagickCLIActionHugemoji(path),
            ['HYPER']: new ImageMagickCLIActionHyper(path),
            ['JPEG']: new ImageMagickCLIActionJPEG(path),
            ['LIQUIDSCALE']: new ImageMagickCLIActionLiquidscale(path),
            ['PET_PET']: new ImageMagickCLIActionPetPet(path),
            ['PIXELATE']: new ImageMagickCLIActionPixelate(path),
            ['REVERSE']: new ImageMagickCLIActionReverse(path),
            ['SKETCH']: new ImageMagickCLIActionSketch(path)
        };
    }

    public abstract probeCommand(command: I): Promise<ProbeResult | null>;

    public async run(command: I): Promise<void> {
        await command.deferReply();
        const metadata = await this.probeCommand(command).catch(() => null);
        if (!metadata) {
            const replyOptions = new MagickReplyBuilder(command).addMagickNoImageEmbed(command.constructor.name); // TODO this should be better...
            return await command.followUp(replyOptions) && undefined;
        }
        const response = await this.fetchMagickResponse(command, metadata);
        const message = await command.followUp(response);
        const collector = DiscordUtil.createComponentCollector(command.client, message);
        collector.on('collect', async component => {
            if (component.isSelectMenu()) {
                if (!DiscordUtil.isAdminOrOwner(component, command)) return component.reply(new MagickReplyBuilder(component).addAdminOrOwnerEmbed());
                await component.deferUpdate();
                const action = this.actions[component.values[0]!]!;
                const metadata = (await probe(message.embeds[0]!.image!.url!).catch(() => null))!;
                const replyOptions = new MagickReplyBuilder(component)
                    .addMagickProgressEmbed(metadata, action, {})
                    .clearAttachments();
                await component.editReply(replyOptions);
                const response = await this.fetchMagickResponse(component, metadata, action, message);
                await component.editReply(response);
            }
        });
    }

    protected async fetchMagickResponse(interaction: Interaction, metadata: ProbeResult, action?: ImageMagickCLIAction, message?: APIMessage | Message): Promise<ResponseOptions> {

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
                if (!(interaction.isSelectMenu())) return; // This is initial svg conversion
                const replyOptions = new MagickReplyBuilder(interaction).addMagickProgressEmbed(metadata, action!, progress);
                if (message) interaction.editReply(replyOptions).catch(HandlerUtil.handleErrors(this));
            }
        }).then((buffer: Buffer) => {
            const newMetadata = probe.sync(buffer)!;
            const replyOptions = new MagickReplyBuilder(interaction).addMagickImageEmbed({ metadata: newMetadata, action: action, actions: this.actions, buffer: buffer });
            return replyOptions;
        }).catch((_reason) => {
            console.log('This should not be unused and action is unknown?'); // TODO fix this here
            return new MagickReplyBuilder(interaction).addMagickFailedEmbed(metadata, action!);
        });
    }
}
