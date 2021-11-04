import { AutocompleteInteraction, CommandInteraction, Guild, GuildMember, Role, TextChannel } from 'discord.js';
import { Autocomplete } from '../../../discord/interfaces/Autocomplete';
import { HandlerClient } from '../../../discord/HandlerClient';
import { DDDCommandData } from './DDDCommandData';
import { BaseHandler } from '../../BaseHandler';
import { DDDDatabase } from './DDDDatabase';
import { DateTime, IANAZone } from 'luxon';
import { DDDEmbed } from './DDDEmbed';
import * as tzdata from 'tzdata';

export class DDDHandler extends BaseHandler implements Autocomplete {

    private static ZONES = Object.keys(tzdata.zones);

    constructor() {
        super({
            id: 'ddd',
            group: 'Event',
            global: false,
            nsfw: false,
            data: DDDCommandData
        })
    }
    public async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partial = interaction.options.getString('timezone', true).toLowerCase();
        const suggestions = DDDHandler.ZONES.filter(zone => zone.toLowerCase().includes(partial));
        const options = suggestions.slice(0, 25).map(suggestion => {
            return { name: suggestion, value: suggestion }
        });
        return interaction.respond(options);
    }

    public async execute(command: CommandInteraction): Promise<any> {
        const { guild, member } = <{ guild: Guild, member: GuildMember }>command;
        const subCommand = command.options.getSubcommand();
        switch (subCommand) {
            case 'register': {
                await command.deferReply();
                const timezone = command.options.getString('timezone', true);
                if (IANAZone.isValidZone(timezone)) {
                    const date = DateTime.now().setZone(timezone);
                    await DDDDatabase.setMember(member, timezone);
                    const settingsRow = await DDDDatabase.fetchSettings(guild);
                    if (settingsRow.role_id) await member.roles.add(settingsRow.role_id).catch(() => { });
                    const replyOptions = DDDEmbed.createConfirmRegisterEmbed(command, date).toReplyOptions(true);
                    return command.followUp(replyOptions)
                } else {
                    return command.followUp(DDDEmbed.createUnknownTimezoneEmbed(command, timezone).toReplyOptions(true));
                }
            }
            case 'settings': {
                await command.deferReply();
                const channel = (command.options.getChannel('channel') || undefined) as TextChannel | undefined;
                const role = (command.options.getRole('role') || undefined) as Role | undefined;
                const settingsRow = await DDDDatabase.setSettings(guild, { channel, role });
                const memberRows = await DDDDatabase.fetchAllMembers(guild);
                if (settingsRow.role_id) {
                    for (const memberRow of memberRows) {
                        const member = guild.members.cache.get(memberRow.user_id) as GuildMember;
                        member.roles.add(settingsRow.role_id).catch(() => { }); // Do not await. Just do whenever...
                    }
                }
                const replyOptions = DDDEmbed.createSettingsEmbed(command, settingsRow, memberRows).toReplyOptions();
                return command.followUp(replyOptions);
            }
            case 'nut': {
                await command.deferReply({ ephemeral: true });
                const description = command.options.getString('description') || undefined;
                await DDDDatabase.setNut(member, command.createdTimestamp.toString(), description);
                const memberRow = await DDDDatabase.fetchMember(member);
                const allNutRows = await DDDDatabase.fetchAllNuts(member);
                if (!memberRow) return command.followUp(DDDEmbed.createNoTimezoneEmbed(command, allNutRows).toReplyOptions());
                const replyOptions = DDDEmbed.createNutEmbed(command, memberRow, allNutRows).toReplyOptions();
                return command.followUp(replyOptions);
            }
        }
    }

    public override async setup(client: HandlerClient): Promise<any> {
        await super.setup(client);
        await DDDDatabase.setup(client).then(() => true);
    }
}
