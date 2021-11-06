import { AutocompleteInteraction, CommandInteraction, Guild, GuildMember, Role, TextChannel } from 'discord.js';
import { ChatInputHandler } from '../../../discord/handler/abstracts/ChatInputHandler';
import { Autocomplete } from '../../../discord/handler/interfaces/Autocomplete';
import { HandlerClient } from '../../../discord/handler/HandlerClient';
import { DDDCommandData } from './DDDCommandData';
import { DDDDatabase } from './DDDDatabase';
import { DateTime, IANAZone } from 'luxon';
import { DDDEmbed } from './DDDEmbed';
import * as tzdata from 'tzdata';
import { Pool } from 'mariadb';

export class DDDHandler extends ChatInputHandler implements Autocomplete {

    private static readonly ZONES = Object.keys(tzdata.zones);
    private readonly database: DDDDatabase;

    constructor(pool: Pool) {
        super({ group: 'Event', global: false, nsfw: false, data: DDDCommandData });
        this.database = new DDDDatabase(pool);
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
                    await this.database.setMember(member, timezone);
                    const settingsRow = await this.database.fetchSettings(guild);
                    if (settingsRow.role_id) await member.roles.add(settingsRow.role_id).catch(() => { });
                    const replyOptions = DDDEmbed.createConfirmRegisterEmbed(command, date).toReplyOptions({ ephemeral: true });
                    return command.followUp(replyOptions)
                } else {
                    return command.followUp(DDDEmbed.createUnknownTimezoneEmbed(command, timezone).toReplyOptions({ ephemeral: true }));
                }
            }
            case 'settings': {
                await command.deferReply();
                const channel = (command.options.getChannel('channel') || undefined) as TextChannel | undefined;
                const role = (command.options.getRole('role') || undefined) as Role | undefined;
                const settingsRow = await this.database.setSettings(guild, { channel, role });
                const memberRows = await this.database.fetchAllMembers(guild);
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
                await this.database.setNut(member, command.createdTimestamp.toString(), description);
                const memberRow = await this.database.fetchMember(member);
                const allNutRows = await this.database.fetchAllNuts(member);
                if (!memberRow) return command.followUp(DDDEmbed.createNoTimezoneEmbed(command, allNutRows).toReplyOptions());
                const replyOptions = DDDEmbed.createNutEmbed(command, memberRow, allNutRows).toReplyOptions();
                return command.followUp(replyOptions);
            }
        }
    }

    public override async setup(client: HandlerClient): Promise<any> {
        return super.setup(client).then(() => this.database.createTables()).then(() => true);
    }
}
