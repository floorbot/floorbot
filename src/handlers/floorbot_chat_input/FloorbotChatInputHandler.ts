import { APIMessage, ChatInputCommandInteraction, CollectedInteraction, Message, MessageComponentInteraction, ModalSubmitInteraction } from "discord.js";
import { FloorbotTextInputComponentID } from './builders/FloorbotTextInputActionRowBuilder.js';
import { FloorbotButtonComponentID } from './builders/FloorbotButtonActionRowBuilder.js';
import { FloorbotChatInputCommandData } from "./FloorbotChatInputCommandData.js";
import { FloorbotModalBuilder } from './builders/FloorbotModalBuilder.js';
import { FloorbotReplyBuilder } from "./builders/FloorbotReplyBuilder.js";
import { ChatInputCommandHandler } from "discord.js-handlers";
import { Util } from '../../lib/helpers/Util.js';

export class FloorbotChatInputHandler extends ChatInputCommandHandler {

    private readonly feedbackChannelID: string;

    constructor(feedbackChannelID: string) {
        super(FloorbotChatInputCommandData);
        this.feedbackChannelID = feedbackChannelID;
    }

    public async run(command: ChatInputCommandInteraction): Promise<void> {
        const message = await this.runPingComponent(command);
        const collector = Util.createComponentCollector(command.client, message);
        collector.on('collect', (component: CollectedInteraction) => {
            if (component.isModalSubmit()) this.runFeedbackModalSubmit(component);
            else {
                switch (component.customId) {
                    case FloorbotButtonComponentID.Ping: { this.runPingComponent(command, component); break; }
                    case FloorbotButtonComponentID.GuildStats: { this.runGuildComponent(command, component); break; }
                    case FloorbotButtonComponentID.Feedback: { this.runFeedbackComponent(component); break; }
                }
            }
        });
    }

    public async runPingComponent(command: ChatInputCommandInteraction, component?: MessageComponentInteraction): Promise<APIMessage | Message> {
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

    public async runFeedbackComponent(component: MessageComponentInteraction): Promise<void> {
        const modal = new FloorbotModalBuilder()
            .setTitle('Submit Feedback')
            .setCustomId('feedback')
            .addFeedbackTextInputActionRows();
        return component.showModal(modal);
    }

    public async runFeedbackModalSubmit(modal: ModalSubmitInteraction) {
        await modal.deferReply({ ephemeral: true });
        const feedbackTitle = modal.fields.getTextInputValue(FloorbotTextInputComponentID.FeedbackTitle);
        const feedbackMessage = modal.fields.getTextInputValue(FloorbotTextInputComponentID.FeedbackMessage);
        const channel = await modal.client.channels.fetch(this.feedbackChannelID);
        if (channel && channel.isTextBased()) {
            const replyOptions = new FloorbotReplyBuilder(modal)
                .addFeedbackEmbed(modal, feedbackTitle, feedbackMessage);
            await channel.send(replyOptions);
        }
        else console.log('[support] Feedback received and channel does not exist');
        const replyOptions = new FloorbotReplyBuilder(modal)
            .addFeedbackReceivedEmbed()
            .setEphemeral(true);
        return modal.followUp(replyOptions);
    }
}
