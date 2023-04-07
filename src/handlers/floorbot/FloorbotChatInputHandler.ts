import { APIMessage, ChatInputCommandInteraction, CollectedInteraction, Message, MessageComponentInteraction, ModalSubmitInteraction } from "discord.js";
import { ChatInputCommandHandler } from "discord.js-handlers";
import { Util } from '../../core/Util.js';
import { FloorbotChatInputCommandData } from './FloorbotChatInputCommandData.js';
import { FloorbotMessageActionRowId } from './builders/FloorbotMessageActionRowBuilder.js';
import { FloorbotModalBuilder } from './builders/FloorbotModalBuilder.js';
import { FloorbotReplyBuilder } from './builders/FloorbotReplyBuilder.js';

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
            if (component.isModalSubmit()) return this.runFeedbackModalSubmit(component);
            else {
                switch (component.customId) {
                    case FloorbotMessageActionRowId.Ping: return this.runPingComponent(command, component);
                    case FloorbotMessageActionRowId.GuildStats: return this.runGuildComponent(command, component);
                    case FloorbotMessageActionRowId.Feedback: return this.runFeedbackComponent(component);
                    default: return;
                }
            }
        });
    }

    public async runPingComponent(command: ChatInputCommandInteraction, component?: MessageComponentInteraction): Promise<APIMessage | Message> {
        const { client } = command;
        const inviteURL = client.generateInvite();

        // Send a reply to interaction
        let replyOptions = new FloorbotReplyBuilder(command)
            .addPingEmbed({ inviteURL, interaction: component || command })
            .addFloorbotActionRow(command, inviteURL);
        let message = component ?
            await component.update({ ...replyOptions, fetchReply: true }) :
            await command.reply({ ...replyOptions, fetchReply: true });

        // Send a reply with time between the interaction received and message sent
        replyOptions = new FloorbotReplyBuilder(command)
            .addPingEmbed({ inviteURL, interaction: component || command, message })
            .addFloorbotActionRow(command, inviteURL);
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
            .addGuildEmbed({ guild, bans })
            .addFloorbotActionRow(command, inviteURL);
        return component.editReply(replyOptions);
    }

    public async runFeedbackComponent(component: MessageComponentInteraction): Promise<void> {
        const modal = FloorbotModalBuilder.feedbackModal();
        return component.showModal(modal);
    }

    public async runFeedbackModalSubmit(modal: ModalSubmitInteraction) {
        await modal.deferReply({ ephemeral: true });
        const channel = await modal.client.channels.fetch(this.feedbackChannelID);
        if (channel && channel.isTextBased()) {
            const replyOptions = new FloorbotReplyBuilder(modal)
                .addFeedbackEmbed({ modal });
            await channel.send(replyOptions);
        }
        else console.log('[support] Feedback received and channel does not exist');
        const replyOptions = new FloorbotReplyBuilder(modal)
            .addFeedbackReceivedEmbed()
            .setEphemeral(true);
        return modal.followUp(replyOptions);
    }
}
