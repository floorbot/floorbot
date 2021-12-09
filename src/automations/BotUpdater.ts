import { HandlerClient } from "../discord/HandlerClient";

export class BotUpdater {

    public static async update(client: HandlerClient): Promise<void> {
        const { application } = client;

        if (application) {
            const commands = await application.commands.fetch();
            for (const command of commands.values()) {
                if (!command.guildId) {
                    if (['admin', 'utils'].includes(command.name)) {
                        await command.delete();
                        console.log(`[updater] Deleted global command <${command.name}>`);
                    }
                }
            }
        }
    }
}