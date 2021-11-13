import { Client, Message } from 'discord.js';

export function MessageReaction(client: Client) {
	client.on('messageCreate', (message: Message) => {
		if (message.content.includes('[LINK]')) {
			const reactEmoji = message.client.emojis.cache.get('639961055157813309')!;
			message.react(reactEmoji);
		}
	})
}