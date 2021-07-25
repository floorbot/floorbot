import { AdminButtonType, AdminHandler, GuildHandlerGroup, GuildHandler, AdminCustomData } from '../../../..'
import { HandlerButton } from 'discord.js-commands';
import { Util, Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class AdminButtonFactory {

    public static getAdminButton(handler: AdminHandler, type: AdminButtonType, group: GuildHandlerGroup, handlers: [GuildHandler<any>, ...GuildHandler<any>[]]): HandlerButton<AdminCustomData> {
        const button = new HandlerButton(handler)

        const customData: AdminCustomData = {
            sub: 'commands',
            type: type,
            group: group
        }

        button.setCustomId(customData)
        const label = Util.capitalizeString(handlers.length > 1 ? 'Commands' : `${handlers[0].id}`)
        switch (type) {
            case AdminButtonType.ENABLE: {
                button.setLabel(`Enable ${label}`);
                button.setStyle(MessageButtonStyles.SUCCESS);
                break;
            }
            case AdminButtonType.DISABLE: {
                button.setLabel(`Disable ${label}`);
                button.setStyle(MessageButtonStyles.DANGER);
                break;
            }
            default: throw { type, handlers };
        }
        return button;
    }
}
