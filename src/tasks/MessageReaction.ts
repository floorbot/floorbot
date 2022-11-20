import { Client, DiscordAPIError, Message, MessageType } from 'discord.js';


export class MessageReaction {

    private static CumEmotes: Array<string> = [
        '916013266537447465', // CUMDETECTED
        '915996947695935528', // BorpaU
        '912127935526346752', // floorpaU
        '906857271387095041', // cumface
        '824077626708328479', // borpa
        '858846864185753642', // borpaspin
    ];

    // This should exist, I shouldn't have to make this shitty function
    private static MessageHasAnyMentions(message: Message): boolean {
        return Boolean(
            message.mentions.everyone
            || message.mentions.roles.size
            || message.mentions.channels.size
            || (message.type === MessageType.Reply ? // This will only fail when the only mention in the message is to the using being replied
                message.mentions.users.size > 1 :
                message.mentions.users.size
            )
        );
    }

    public static setup(client: Client): void {
        client.on('messageCreate', (message: Message) => {
            // Reacts with Libido when [LINK] is detected
            if (message.content.includes('[LINK]')) {
                const reactEmoji = message.client.emojis.cache.get('639961055157813309')!;
                message.react(reactEmoji).catch(error => {
                    // User has bot blocked and permission to react is denied...
                    if (!(error instanceof DiscordAPIError) || error.status !== 403) {
                        console.error('[message-reaction](controller) failed to react to [LINK]...', error);
                    }
                });
            }

            // Reacts with random borpa emote when any combination of "cum" is detected
            if (message.content.match(/\b[c]+[u]+[m]+\b/i) != null) {
                const CumEmote = MessageReaction.CumEmotes[MessageReaction.CumEmotes.length * Math.random() << 0]!;
                const reactEmoji = message.client.emojis.cache.get(CumEmote)!;
                message.react(reactEmoji).catch(error => {
                    // User has bot blocked and permission to react is denied...
                    if (!(error instanceof DiscordAPIError) || error.status !== 403) {
                        console.error('[message-reaction](controller) failed to react to cum...', error);
                    }
                });
            }

            // Reacts with JinPing when a bot sends a message with a ping
            if (message.author.bot && MessageReaction.MessageHasAnyMentions(message)) {
                message.react('718814332154019880').catch(error => {
                    // User has bot blocked and permission to react is denied...
                    if (!(error instanceof DiscordAPIError) || error.status !== 403) {
                        console.error('[message-reaction](controller) failed to react to bot pinging someone...', error);
                    }
                });
            }
        });
    }
}
