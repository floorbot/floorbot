import { GuildCommandHandlerGroup, AdminHandler, CommonResponseFactory, GuildCommandHandler, AdminButtonType } from '../../..';
import { InteractionReplyOptions, MessageActionRow } from 'discord.js';
import { HandlerContext, CommandClient } from 'discord.js-commands';


export class AdminResponseFactory extends CommonResponseFactory<AdminHandler> {

    constructor(handler: AdminHandler) {
        super(handler);
    }

    public async fetchCommandResponse(context: HandlerContext, group?: GuildCommandHandlerGroup, handlerIds?: Array<string>): Promise<InteractionReplyOptions> {
        if (!(context.client instanceof CommandClient)) throw context;
        const embed = await this.handler.embedFactory.fetchCommandsEmbed(context);
        const groupActionRow = this.handler.selectMenuFactory.getGuildHandlerGroupSelectMenu(group).toActionRow();
        if (!group) return { embeds: [embed], components: [groupActionRow] };
        const handlers = context.client.handlers.filter(handler => handler instanceof GuildCommandHandler && handlerIds && handlerIds.includes(handler.id)) as [GuildCommandHandler, ...GuildCommandHandler[]];
        const handlerActionRow = this.handler.selectMenuFactory.getGuildHandlerSelectMenu(context, group, handlers).toActionRow();
        if (!handlers.length) return { embeds: [embed], components: [groupActionRow, handlerActionRow] }
        const handlerButtonActionRow = new MessageActionRow().addComponents([
            this.handler.buttonFactory.getAdminButton(AdminButtonType.ENABLE, group, handlers),
            this.handler.buttonFactory.getAdminButton(AdminButtonType.DISABLE, group, handlers)
        ]);
        return { embeds: [embed], components: [groupActionRow, handlerActionRow, handlerButtonActionRow] }
    }
}
