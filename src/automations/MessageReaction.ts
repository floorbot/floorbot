import { Client, DiscordAPIError, Message } from 'discord.js';

export class MessageReaction {

    public static setup(client: Client): void {
        client.on('messageCreate', (message: Message) => {
            // Reacts with Libido when [LINK] is detected
			if (message.content.includes('[LINK]')) {
                const reactEmoji = message.client.emojis.cache.get('639961055157813309')!;
                message.react(reactEmoji).catch(error => {
                    // User has bot blocked and permission to react is denied...
                    if (!(error instanceof DiscordAPIError) || error.httpStatus !== 403) {
                        console.error('[message-reaction](controller) failed to react...', error)
                    }
                });
            }

			// Reacts with BorpaU when any combination of "cum" is detected
			if (message.content.match(/\b[c]+[u]+[m]+\b/i) != null) {
				const reactEmoji = message.client.emojis.cache.get('915996947695935528')!;
                message.react(reactEmoji).catch(error => {
                    // User has bot blocked and permission to react is denied...
                    if (!(error instanceof DiscordAPIError) || error.httpStatus !== 403) {
                        console.error('[message-reaction](controller) failed to react...', error)
                    }
                });
            }
        })
    }
}