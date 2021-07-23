import { AdminHandler, AdminCustomData, GuildCommandHandlerGroup, GuildCommandHandler, AdminButtonType } from '../../../..';
import { ButtonFactory, HandlerButton } from 'discord.js-commands';
import { Util, Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class AdminButtonFactory extends ButtonFactory<AdminCustomData, AdminHandler> {

    constructor(handler: AdminHandler) {
        super(handler);
    }

    public getAdminButton(type: AdminButtonType, group: GuildCommandHandlerGroup, handlers: [GuildCommandHandler, ...GuildCommandHandler[]]): HandlerButton<AdminCustomData, AdminHandler> {
        const button = new HandlerButton(this.handler)

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
