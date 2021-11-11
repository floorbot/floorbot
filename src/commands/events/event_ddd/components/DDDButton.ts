import { HandlerButton, HandlerButtonID } from '../../../../discord/components/HandlerButton';
import { MessageButton, MessageButtonOptions, Constants } from 'discord.js';

const { MessageButtonStyles } = Constants;

export const DDDButtonID = {
    ...HandlerButtonID, ...{
        SET_EVENT_CHANNEL: 'set_event_channel',
        CLEAR_EVENT_CHANNEL: 'clear_event_channel',
        CREATE_EVENT_ROLE: 'create_event_role',
        DELETE_EVENT_ROLE: 'delete_event_role',
        CREATE_PASSING_ROLE: 'create_passing_role',
        DELETE_PASSING_ROLE: 'delete_passing_role',
        CREATE_FAILED_ROLE: 'create_failed_role',
        DELETE_FAILED_ROLE: 'delete_failed_role'
    }
};

export class DDDButton extends HandlerButton {

    constructor(data?: MessageButton | MessageButtonOptions) {
        super(data);
    }

    public static createSetChannelButton() {
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

    public static createCreateEventRoleButton() {
        return new DDDButton()
            .setLabel('Create Event Role')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(DDDButtonID.CREATE_EVENT_ROLE);
    }

    public static createDeleteEventRoleButton() {
        return new DDDButton()
            .setLabel('Delete Event Role')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(DDDButtonID.DELETE_EVENT_ROLE);
    }

    public static createCreatePassingRoleButton() {
        return new DDDButton()
            .setLabel('Create Passing Role')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(DDDButtonID.CREATE_PASSING_ROLE);
    }

    public static createDeletePassingRoleButton() {
        return new DDDButton()
            .setLabel('Delete Passing Role')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(DDDButtonID.DELETE_PASSING_ROLE);
    }

    public static createCreateFailedRoleButton() {
        return new DDDButton()
            .setLabel('Create Failed Role')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(DDDButtonID.CREATE_FAILED_ROLE);
    }

    public static createDeleteFailedRoleButton() {
        return new DDDButton()
            .setLabel('Delete Failed Role')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(DDDButtonID.DELETE_FAILED_ROLE);
    }
}
