
import { ButtonBuilder, ButtonBuilderData } from '../../../lib/builders/ButtonBuilder.js';
import { ButtonActionRowBuilder } from '../../../lib/builders/ButtonActionRowBuilder.js';
import { ButtonStyle } from "discord.js";

export enum FloorbotButtonComponentID {
    Ping = 'ping',
    GuildStats = 'guild_stats',
    Feedback = 'feedback'
}

export class FloorbotButtonActionRowBuilder extends ButtonActionRowBuilder {

    public addInviteButton(inviteURL: string, data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Invite Link')
            .setStyle(ButtonStyle.Link)
            .setURL(inviteURL);
        return this.addComponents(button);
    }

    public addPingButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Ping')
            .setStyle(ButtonStyle.Success)
            .setCustomId(FloorbotButtonComponentID.Ping);
        return this.addComponents(button);
    }

    public addGuildStatsButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Guild Stats')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(FloorbotButtonComponentID.GuildStats);
        return this.addComponents(button);
    }

    public addFeedbackButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Feedback')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(FloorbotButtonComponentID.Feedback);
        return this.addComponents(button);
    }
}
