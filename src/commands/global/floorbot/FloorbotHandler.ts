import { ApplicationCommand, CommandInteraction, Constants, Guild, Message, SelectMenuInteraction, VoiceChannel } from 'discord.js';
import { ChatInputHandler } from '../../../lib/discord/handlers/abstracts/ChatInputHandler.js';
import { HandlerReplies } from '../../../lib/discord/helpers/HandlerReplies.js';
import { FloorbotButtonID, FloorbotReplies } from './FloorbotReplies.js';
import { HandlerClient } from '../../../lib/discord/HandlerClient.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import { FloorbotCommandData } from './FloorbotCommandData.js';
import { Handler } from '../../../lib/discord/Handler.js';
import { BaseHandler } from 'discord.js-handlers';

export type HandlerMap = Map<Handler<any>, ApplicationCommand | undefined>;
export type GroupHandlerMap = Map<string, HandlerMap>;

const { ApplicationCommandTypes } = Constants;

export class FloorbotHandler extends ChatInputHandler {

    private readonly replies: FloorbotReplies;

    constructor() {
        super({ group: 'Global', global: true, nsfw: false, data: FloorbotCommandData });
        this.replies = new FloorbotReplies();
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {
        const { guild, member } = command;
        const subCommand = command.options.getSubcommand();

        switch (subCommand) {
            case 'about': {
                let aboutReplyOptions = this.replies.createAboutReply(command);
                const message = await command.reply({ ...aboutReplyOptions, fetchReply: true });
                aboutReplyOptions = this.replies.createAboutReply(command, message);
                const bans = await guild.bans.fetch({ cache: false }).catch(_error => { return undefined; });
                const guildReplyOptions = this.replies.createGuildReply(command, guild, bans);

                await command.editReply(aboutReplyOptions);
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
                collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
                    await component.deferUpdate();
                    switch (component.customId) {
                        case FloorbotButtonID.ABOUT: return component.editReply(aboutReplyOptions);
                        case FloorbotButtonID.GUILD: return component.editReply(guildReplyOptions);
                        default: throw new Error(`[floorbot] Unknown component id <${component.customId}>`);
                    }
                }));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                break;
            }
            case 'screenshare': {
                if (!member) return command.reply(this.replies.createGuildOnlyReply(command));
                const channel = command.options.getChannel('channel') || member.voice.channel;
                if (!channel || !(channel instanceof VoiceChannel)) return command.reply(this.replies.createNoVoiceChannelReply(command));
                return command.reply(this.replies.createScreenshareReply(command, channel));
            }
            case 'commands': {
                if (!guild) return command.reply(this.replies.createGuildOnlyReply(command));
                if (!HandlerUtil.isAdminOrOwner(member)) return command.reply(this.replies.createAdminOrOwnerReply(command));
                await command.deferReply();
                let groupComponent: SelectMenuInteraction | undefined = undefined;
                let commandsComponent: SelectMenuInteraction | undefined = undefined;
                let groupHandlerMap = await this.fetchHandlerMap(guild);
                const response = this.replies.createCommandsReply(command, groupHandlerMap, groupComponent, commandsComponent);
                let message = await command.followUp(response) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', HandlerUtil.handleCollectorErrors(async (component) => {
                    if (!HandlerUtil.isAdminOrOwner(member, command)) return command.reply(HandlerReplies.createAdminOrOwnerReply(command));
                    if (component.isSelectMenu() && component.customId === 'groups') {
                        await component.deferUpdate();
                        const response = this.replies.createCommandsReply(command, groupHandlerMap, groupComponent = component, commandsComponent = undefined);
                        message = await (<Message>component.message).edit(response);
                    }
                    if (component.isSelectMenu() && component.customId === 'commands') {
                        await component.deferUpdate();
                        const response = this.replies.createCommandsReply(command, groupHandlerMap, groupComponent, commandsComponent = component);
                        message = await (<Message>component.message).edit(response);
                    }
                    if (component.isButton()) {
                        await component.deferUpdate();
                        const group = groupComponent!.values[0]!;
                        const handlers = [...groupHandlerMap.get(group)!.keys()];
                        for (const [index, handler] of handlers.entries()) {
                            if (commandsComponent!.values.includes(index.toString())) {
                                if (component.customId === 'enable') await guild.commands.create(handler.data);
                                if (component.customId === 'disable') {
                                    const appCommands = await guild.commands.fetch();
                                    const appCommand = appCommands.find(appCommand => this.isCorrectHandler(handler, appCommand));
                                    if (appCommand) await appCommand.delete();
                                }
                            }
                        }
                        groupHandlerMap = await this.fetchHandlerMap(guild);
                        const response = this.replies.createCommandsReply(command, groupHandlerMap, groupComponent, commandsComponent);
                        message = await (<Message>component.message).edit(response);
                    }
                }));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                return message;
            }
        }
    }

    public override async setup(client: HandlerClient): Promise<any> {
        await super.setup(client);
        if (client.application) {
            const handlers = client.handlers.filter(handler => !(handler instanceof BaseHandler) && handler.global) as Handler<any>[];
            const appCommands = await client.application.commands.fetch();
            for (const handler of handlers) {
                const appCommand = appCommands.find(appCommand => this.isCorrectHandler(handler, appCommand));
                if (!appCommand) {
                    const posted = await client.application.commands.create(handler.data);
                    client.emit('log', `[setup](${handler.toString()}) Posted missing global command to discord <${posted.id}>`);
                }
            }
        }
    }

    private async fetchHandlerMap(guild: Guild): Promise<GroupHandlerMap> {
        const client = guild.client as HandlerClient;
        const handlers = client.handlers.filter(handler => !(handler instanceof BaseHandler) && !handler.global) as Handler<any>[];
        const appCommands = await guild.commands.fetch();
        const groupHandlerMap = new Map();
        for (const handler of handlers) {
            const appCommand = appCommands.find(appCommand => this.isCorrectHandler(handler, appCommand));
            if (!groupHandlerMap.has(handler.group)) groupHandlerMap.set(handler.group, new Map());
            groupHandlerMap.get(handler.group).set(handler, appCommand);
        }
        return groupHandlerMap;
    }

    private isCorrectHandler(handler: Handler<any>, appCommand: ApplicationCommand) {
        if (appCommand.name !== handler.data.name) return false;
        switch (true) {
            case (handler.data.type === undefined && appCommand.type === 'CHAT_INPUT'):
            case (handler.data.type === ApplicationCommandTypes.USER && appCommand.type === 'USER'):
            case (handler.data.type === ApplicationCommandTypes.MESSAGE && appCommand.type === 'MESSAGE'):
            case (handler.data.type === ApplicationCommandTypes.CHAT_INPUT && appCommand.type === 'CHAT_INPUT'): {
                return true;
            }
            default: {
                return false;
            }
        }
    }
}
