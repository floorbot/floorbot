import { BaseHandler, CommandClient, HandlerResult } from 'discord.js-commands';
import * as nconf from 'nconf';

export class UpdateHandler extends BaseHandler {

    constructor() {
        super({ id: 'updater' });
    }

    public override async initialise(client: CommandClient): Promise<HandlerResult> {
        let totalUpdated = 0;
        const updates = nconf.get('UPDATE');
        const guilds = client.guilds.cache;
        for (const [_id1, guild] of guilds) {
            const commands = await guild.commands.fetch();
            for (const [_id2, command] of commands) {
                for (const handler of client.handlers) {
                    if (handler.isCommandHandler() && handler.id === command.name) {
                        if (updates[handler.id] && handler.isCommandHandler()) {
                            if (command.createdTimestamp < updates[handler.id]) {
                                await command.delete();
                                await guild.commands.create(handler.commandData);
                                totalUpdated++;
                            }
                        }
                    }
                }
            }
        }
        return { message: `Posted ${totalUpdated} commands across ${guilds.size} guilds to Discord` };
    }
}
