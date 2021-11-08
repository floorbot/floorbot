import { HandlerButton, HandlerButtonID } from '../../../../discord/components/HandlerButton';
import { MessageButton, MessageButtonOptions, Constants } from 'discord.js';

const { MessageButtonStyles } = Constants;

export const DDDButtonID = {
    ...HandlerButtonID, ...{
        SET_EVENT_CHANNEL: 'set_event_channel',
        CLEAR_EVENT_CHANNEL: 'clear_event_channel',
        CREATE_EVENT_ROLE: 'create_event_role',
        DELETE_EVENT_ROLE: 'delete_event_role'
    }
};

export class DDDButton extends HandlerButton {

    constructor(data?: MessageButton | MessageButtonOptions) {
        super(data);
    }

    public static createUseChannelButton() {
        return new DDDButton()
            .setLabel('Set Event Channel')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(DDDButtonID.SET_EVENT_CHANNEL);
    }

    public static createClearChannelButton() {
        return new DDDButton()
            .setLabel('Clear Event Channel')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(DDDButtonID.CLEAR_EVENT_CHANNEL);
    }

    public static createCreateRoleButton() {
        return new DDDButton()
            .setLabel('Create Role')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(DDDButtonID.CREATE_EVENT_ROLE);
    }

    public static createDeleteRoleButton() {
        return new DDDButton()
            .setLabel('Clear Role')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(DDDButtonID.DELETE_EVENT_ROLE);
    }
}
