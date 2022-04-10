import { ChatInputApplicationCommandData, ChatInputCommandInteraction } from 'discord.js';
import { MagickChatInputCommandData } from './MagickChatInputCommandData.js';
import { HandlerUtil } from '../../../../lib/discord/HandlerUtil.js';
import probe, { ProbeResult } from 'probe-image-size';
import { MagickHandler } from '../MagickHandler.js';

export class MagickChatInputHandler extends MagickHandler<ChatInputCommandInteraction, ChatInputApplicationCommandData> {


    constructor(path?: string) {
        super(MagickChatInputCommandData, path);
    }

    public async probeCommand(chatInput: ChatInputCommandInteraction): Promise<ProbeResult | null> {

        switch (chatInput.options.getSubcommand()) {
            case 'url': {
                // TODO maybe allow resolving user/member but emojis should be fine...
                const input = chatInput.options.getString('image', true);
                const resolvedUser = HandlerUtil.resolveUser(chatInput, input, true);
                const resolvedEmoji = HandlerUtil.resolveEmoji(input);
                const metadata = await probe(
                    !resolvedUser && !resolvedEmoji ? input : resolvedUser ?
                        resolvedUser.displayAvatarURL() :
                        resolvedEmoji!.imageURL
                ).catch(() => null);
                return metadata;
            }
            case 'attachment': {
                const attachment = chatInput.options.getAttachment('attachment', true);
                return probe(attachment.url);
            }
            default: return null;
        }
    }
}
