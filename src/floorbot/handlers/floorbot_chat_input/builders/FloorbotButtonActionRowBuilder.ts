import { ButtonBuilder, ButtonBuilderData } from "../../../../lib/discord/builders/ButtonBuilder.js";
import { ButtonActionRowBuilder } from "../../../../lib/discord/builders/ButtonActionRowBuilder.js";
import { ButtonStyle } from "discord.js";

export enum FloorbotButtonComponentID {
    Ping = 'ping',
    GuildStats = 'guild_stats',
    ReportBug = 'report_bug'
}

export class FloorbotButtonActionRowBuilder extends ButtonActionRowBuilder {

    public addInviteButton(inviteURL: string, data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Invite Link')
            .setStyle(ButtonStyle.Link)
            .setURL(inviteURL);
        return this.addComponent(button);
    }

    public addPingButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Ping')
            .setStyle(ButtonStyle.Success)
            .setCustomId(FloorbotButtonComponentID.Ping);
        return this.addComponent(button);
    }

    public addGuildStatsButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Guild Stats')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(FloorbotButtonComponentID.GuildStats);
        return this.addComponent(button);
    }

    public addReportBugButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Report Bug')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(FloorbotButtonComponentID.ReportBug);
        return this.addComponent(button);
    }
}
