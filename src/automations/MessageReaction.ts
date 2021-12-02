import { Client, DiscordAPIError, Message } from 'discord.js';

export class MessageReaction {

    private static CumEmotes: Array<string> = [
        '916013266537447465', // CUMDETECTED
		'915996947695935528', // BorpaU
		'912127935526346752', // floorpaU
		'906857271387095041', // cumface
		'824077626708328479', // borpa
		'858846864185753642', // borpaspin
    ];

    public static setup(client: Client): void {
        client.on('messageCreate', (message: Message) => {
            // Reacts with Libido when [LINK] is detected
			if (message.content.includes('[LINK]')) {
                const reactEmoji = message.client.emojis.cache.get('639961055157813309')!;
                message.react(reactEmoji).catch(error => {
                    // User has bot blocked and permission to react is denied...
                    if (!(error instanceof DiscordAPIError) || error.httpStatus !== 403) {
                        console.error('[message-reaction](controller) failed to react to [LINK]...', error)
                    }
                });
            }

			// Reacts with random borpa emote when any combination of "cum" is detected
			if (message.content.match(/\b[c]+[u]+[m]+\b/i) != null) {
				const CumEmote = MessageReaction.CumEmotes[MessageReaction.CumEmotes.length * Math.random() << 0]!;
				const reactEmoji = message.client.emojis.cache.get(CumEmote)!;
                message.react(reactEmoji).catch(error => {
                    // User has bot blocked and permission to react is denied...
                    if (!(error instanceof DiscordAPIError) || error.httpStatus !== 403) {
                        console.error('[message-reaction](controller) failed to react to cum...', error)
                    }
                });
            }
        })
    }
}