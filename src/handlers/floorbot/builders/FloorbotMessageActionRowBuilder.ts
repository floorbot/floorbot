
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from "discord.js";
import { HandlerContext } from 'discord.js-handlers';

export enum FloorbotMessageActionRowId {
    Ping = 'ping',
    GuildStats = 'guild_stats',
    Feedback = 'feedback'
}

export class FloorbotMessageActionRowBuilder extends ActionRowBuilder<MessageActionRowComponentBuilder> {

    public addInviteButton(inviteURL: string): this {
        const button = new ButtonBuilder()
            .setLabel('Invite Link')
            .setStyle(ButtonStyle.Link)
            .setURL(inviteURL);
        return this.addComponents(button);
    }

    public addPingButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Ping')
            .setStyle(ButtonStyle.Success)
            .setCustomId(FloorbotMessageActionRowId.Ping);
        return this.addComponents(button);
    }

    public addGuildStatsButton(context: HandlerContext): this {
        const button = new ButtonBuilder()
            .setLabel('Guild Stats')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!context.inGuild())
            .setCustomId(FloorbotMessageActionRowId.GuildStats);
        return this.addComponents(button);
    }

    public addFeedbackButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Feedback')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(FloorbotMessageActionRowId.Feedback);
        return this.addComponents(button);
    }
}
