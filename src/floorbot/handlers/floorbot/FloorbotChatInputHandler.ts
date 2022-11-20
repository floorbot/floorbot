import { APIMessage, ChatInputCommandInteraction, CollectedInteraction, Message, MessageComponentInteraction, ModalSubmitInteraction } from "discord.js";
import { ChatInputCommandHandler } from "discord.js-handlers";
import { Util } from '../../../app/Util.js';
import { FloorbotComponentID } from './builders/FloorbotActionRow.js';
import { FloorbotCommand } from './builders/FloorbotCommand.js';
import { FloorbotModal } from './builders/FloorbotModal.js';
import { FloorbotReply } from './builders/FloorbotReply.js';

export class FloorbotChatInputHandler extends ChatInputCommandHandler {

    private readonly feedbackChannelID: string;

    constructor(feedbackChannelID: string) {
        super(FloorbotCommand.slashCommand());
        this.feedbackChannelID = feedbackChannelID;
    }

    public async run(command: ChatInputCommandInteraction): Promise<void> {
        const message = await this.runPingComponent(command);
        const collector = Util.createComponentCollector(command.client, message);
        collector.on('collect', (component: CollectedInteraction) => {
            if (component.isModalSubmit()) this.runFeedbackModalSubmit(component);
            else {
                switch (component.customId) {
                    case FloorbotComponentID.Ping: { this.runPingComponent(command, component); break; }
                    case FloorbotComponentID.GuildStats: { this.runGuildComponent(command, component); break; }
                    case FloorbotComponentID.Feedback: { this.runFeedbackComponent(component); break; }
                }
            }
        });
    }

    public async runPingComponent(command: ChatInputCommandInteraction, component?: MessageComponentInteraction): Promise<APIMessage | Message> {
        const { client } = command;
        const inviteURL = client.generateInvite();

        // Send a reply to interaction
        let replyOptions = new FloorbotReply(command)
            .addPingEmbed({ inviteURL, interaction: component || command })
            .addFloorbotActionRow(command, inviteURL);
        let message = component ?
            await component.update({ ...replyOptions, fetchReply: true }) :
            await command.reply({ ...replyOptions, fetchReply: true });

        // Send a reply with time between the interaction received and message sent
        replyOptions = new FloorbotReply(command)
            .addPingEmbed({ inviteURL, interaction: component || command, message })
            .addFloorbotActionRow(command, inviteURL);
        return component ?
            component.editReply(replyOptions) :
            command.editReply(replyOptions);
    }

    public async runGuildComponent(command: ChatInputCommandInteraction, component: MessageComponentInteraction): Promise<APIMessage | Message> {
        const { client, guild } = component;
        if (!guild) {
            const replyOptions = new FloorbotReply(command)
                .addGuildOnlyEmbed();
            return component.reply({ ...replyOptions, fetchReply: true });
        }
        const inviteURL = client.generateInvite();
        await component.deferUpdate();
        const bans = await guild.bans.fetch({ cache: false }).catch(_error => undefined);
        const replyOptions = new FloorbotReply(command)
            .addGuildEmbed({ guild, bans })
            .addFloorbotActionRow(command, inviteURL);
        return component.editReply(replyOptions);
    }

    public async runFeedbackComponent(component: MessageComponentInteraction): Promise<void> {
        const modal = FloorbotModal.feedbackModal();
        return component.showModal(modal);
    }

    public async runFeedbackModalSubmit(modal: ModalSubmitInteraction) {
        await modal.deferReply({ ephemeral: true });
        const channel = await modal.client.channels.fetch(this.feedbackChannelID);
        if (channel && channel.isTextBased()) {
            const replyOptions = new FloorbotReply(modal)
                .addFeedbackEmbed({ modal });
            await channel.send(replyOptions);
        }
        else console.log('[support] Feedback received and channel does not exist');
        const replyOptions = new FloorbotReply(modal)
            .addFeedbackReceivedEmbed()
            .setEphemeral(true);
        return modal.followUp(replyOptions);
    }
}
