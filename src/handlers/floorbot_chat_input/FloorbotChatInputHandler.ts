import { ChatInputCommandInteraction, ComponentType, Message, MessageComponentInteraction } from "discord.js";
import { FloorbotButtonComponentID } from './builders/FloorbotButtonActionRowBuilder.js';
import { FloorbotChatInputCommandData } from "./FloorbotChatInputCommandData.js";
import { FloorbotReplyBuilder } from "./builders/FloorbotReplyBuilder.js";
import { DiscordUtil } from '../../lib/discord/DiscordUtil.js';
import { ChatInputCommandHandler } from "discord.js-handlers";
import { APIMessage } from 'discord-api-types/v10';

export class FloorbotChatInputHandler extends ChatInputCommandHandler {

    constructor() {
        super(FloorbotChatInputCommandData);
    }

    public async run(command: ChatInputCommandInteraction): Promise<void> {
        const message = await this.runPingInteraction(command);
        const collector = DiscordUtil.createComponentCollector(command.client, message);
        collector.on('collect', async (component: MessageComponentInteraction) => {
            switch (component.customId) {
                case FloorbotButtonComponentID.Ping: return await this.runPingInteraction(command, component) && undefined;
                case FloorbotButtonComponentID.GuildStats: return await this.runGuildComponent(command, component) && undefined;
                case FloorbotButtonComponentID.ReportBug: {
                    const replyOptions = new FloorbotReplyBuilder(command)
                        .addUnknownComponentEmbed(component)
                        .setEphemeral(true);
                    return component.reply(replyOptions);
                }
            }
        });
    }

    public async runPingInteraction(command: ChatInputCommandInteraction, component?: MessageComponentInteraction): Promise<APIMessage | Message> {
        const { client } = command;
        const inviteURL = client.generateInvite();

        // Send a reply to interaction
        let replyOptions = new FloorbotReplyBuilder(command)
            .addPingEmbed(inviteURL, component || command)
            .addFloorbotButtonActionRow(inviteURL, command);
        let message = component ?
            await component.update({ ...replyOptions, fetchReply: true }) :
            await command.reply({ ...replyOptions, fetchReply: true });

        // Send a reply with time between the interaction received and message sent
        replyOptions = new FloorbotReplyBuilder(command)
            .addPingEmbed(inviteURL, component || command, message)
            .addFloorbotButtonActionRow(inviteURL, command);
        return component ?
            component.editReply(replyOptions) :
            command.editReply(replyOptions);
    }

    public async runGuildComponent(command: ChatInputCommandInteraction, component: MessageComponentInteraction): Promise<APIMessage | Message> {
        const { client, guild } = component;
        if (!guild) {
            const replyOptions = new FloorbotReplyBuilder(command)
                .addGuildOnlyEmbed();
            return component.reply({ ...replyOptions, fetchReply: true });
        }
        const inviteURL = client.generateInvite();
        await component.deferUpdate();
        const bans = await guild.bans.fetch({ cache: false }).catch(_error => undefined);
        const replyOptions = new FloorbotReplyBuilder(command)
            .addGuildEmbed(guild, bans)
            .addFloorbotButtonActionRow(inviteURL, command);
        return component.editReply(replyOptions);
    }

    public async runReportBugComponent(component: MessageComponentInteraction) {
        component.showModal({
            title: 'My Cool Modal',
            custom_id: 'cool_modal',
            components: [{
                type: ComponentType.ActionRow,
                components: [{
                    type: 4,
                    custom_id: 'name',
                    label: 'Name',
                    style: 1,
                    min_length: 1,
                    max_length: 2000,
                    placeholder: 'John',
                    required: true
                }]
            }]
        });
    }
}
