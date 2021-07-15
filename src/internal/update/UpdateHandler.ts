import { BaseHandler, CommandClient } from 'discord.js-commands';
import * as nconf from 'nconf';

export class UpdateHandler extends BaseHandler {

    constructor(client: CommandClient) {
        super(client, {
            id: 'updater',
            name: 'Updater',
            group: 'Internal',
            nsfw: false
        });
    }

    public async initialise(): Promise<any> {
        let totalUpdated = 0;
        const updates = nconf.get('UPDATE');
        const guilds = this.client.guilds.cache;
        for (const guild of guilds.array()) {
            const commands = await guild.commands.fetch();
            for (const command of commands.array()) {
                const handler = this.client.handlers.get(command.name);
                if (!handler) await command.delete();
                else if (updates[handler.id] && handler.isCommandHandler()) {
                    if (command.createdTimestamp < updates[handler.id]) {
                        await command.edit(handler.commandData);
                        totalUpdated++;
                    }
                }
            }
        }
        this.client.emit('log', `[setup](${this.id}) Posted ${totalUpdated} commands across ${guilds.size} guilds to Discord`);
        return true;
    }
}
