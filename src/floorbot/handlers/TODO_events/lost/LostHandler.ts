import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { ChatInputCommandHandler } from 'discord.js-handlers';
import { LostCommandData } from './LostCommandData.js';

export class LostHandler extends ChatInputCommandHandler {

    constructor() {
        super(LostCommandData);
    }

    public async run(command: ChatInputCommandInteraction): Promise<any> {
        const member = command.member as GuildMember;
        if (member.roles.cache.has('904334044257452042')) {
            await member.roles.remove('904334044257452042');
            await member.roles.add('904346113702785024');
            await (<any>command.channel).send(`<@&904334044257452042> <@&904346113702785024> ${member.toString()} has lost No Nut November!`);
        }
    }
}
