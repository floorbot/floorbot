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
        if (member.roles.cache.has('904334044257452042')) {
            await member.roles.remove('904334044257452042');
            await member.roles.add('904346113702785024');
            await (<any>command.channel).send(`<@&904334044257452042> <@&904346113702785024> ${member.toString()} has lost No Nut November!`);
        }
    }
}
