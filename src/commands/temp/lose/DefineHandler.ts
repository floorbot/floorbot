import { CommandInteraction, GuildMember } from 'discord.js';
import { LostCommandData } from './LostCommandData';
import { BaseHandler } from '../../BaseHandler';

export class LostHandler extends BaseHandler {

    constructor() {
        super({
            id: 'lost',
            group: 'temp',
            global: false,
            nsfw: false,
            data: LostCommandData
        })
    }

    public async execute(command: CommandInteraction): Promise<any> {
        const member = command.member as GuildMember;
        if (member.roles.cache.has('256715626951868416')) {
            await command.deferReply();
            await member.roles.remove('256715626951868416');
            await command.followUp({
                content: `<@&256715626951868416> ${member.toString()} has lost NNN!`,
                allowedMentions: { parse: [] }
            })
        }
    }
}
