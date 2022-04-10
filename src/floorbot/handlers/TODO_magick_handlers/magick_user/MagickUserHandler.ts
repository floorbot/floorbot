import { UserApplicationCommandData, UserContextMenuCommandInteraction } from 'discord.js';
import { MagickUserCommandData } from './MagickUserCommandData.js';
import probe, { ProbeResult } from 'probe-image-size';
import { MagickHandler } from '../MagickHandler.js';

export class MagickUserHandler extends MagickHandler<UserContextMenuCommandInteraction, UserApplicationCommandData> {

    constructor(path?: string) {
        super(MagickUserCommandData, path);
    }

    public async probeCommand(contextMenu: UserContextMenuCommandInteraction): Promise<ProbeResult | null> {
        if (contextMenu.inCachedGuild()) {
            const { member } = contextMenu;
            const avatar = member.displayAvatarURL();
            return probe(avatar);
        }
        if (contextMenu.inRawGuild()) {
            const { member } = contextMenu;
            const guildId = contextMenu.guildId;
            if (member.avatar) {
                const avatar = contextMenu.client.rest.cdn.guildMemberAvatar(guildId, member.user.id, member.avatar);
                return probe(avatar);
            }
        }
        const { user } = contextMenu;
        const avatar = user.displayAvatarURL();
        return probe(avatar);
    }
}
