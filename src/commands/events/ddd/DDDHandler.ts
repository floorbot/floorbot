import { AutocompleteInteraction, CommandInteraction, GuildMember, MessageActionRow, MessageComponentInteraction, TextChannel } from 'discord.js';
import { ChatInputHandler } from '../../../discord/handler/abstracts/ChatInputHandler';
import { Autocomplete } from '../../../discord/handler/interfaces/Autocomplete';
import { DDDDatabase, DDDMemberRow, DDDSettingsRow } from './DDDDatabase';
import { HandlerClient } from '../../../discord/handler/HandlerClient';
import { HandlerUtil } from '../../../discord/handler/HandlerUtil';
import { DDDButton, DDDButtonID } from './components/DDDButton';
import { DDDSeasonDetails, DDDUtil } from './DDDUtil';
import { DDDCommandData } from './DDDCommandData';
import { DDDEmbed } from './components/DDDEmbed';
import { IANAZone } from 'luxon';
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

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {
        const { guild, member, channel } = command;
        const subCommand = command.options.getSubcommand();
        const seasonDetails = DDDUtil.getSeasonDetails();
        switch (subCommand) {
            case 'join': {
                await command.deferReply();
                const timezone = command.options.getString('timezone', true);
                const zoneDetails = IANAZone.isValidZone(timezone) ? DDDUtil.getZoneDetails(timezone) : null;
                const memberRow = await this.database.fetchMember(member, seasonDetails.season);
                const memberZoneDetails = memberRow ? DDDUtil.getZoneDetails(memberRow.timezone) : null;
                const allNutRows = await this.database.fetchAllNuts(member, seasonDetails.season);
                if (
                    (allNutRows.length) ||                                      // Already reported a DDD nut for current zone
                    (!zoneDetails || zoneDetails.isDecemberish) ||              // New zone is invalid or has already begun DDD
                    (memberZoneDetails && memberZoneDetails.isDecemberish)      // Existing zone has already begun DDD
                ) { return command.followUp(DDDEmbed.createJoinFailEmbed(command, timezone, seasonDetails, memberZoneDetails, zoneDetails, allNutRows).toReplyOptions()); }
                await this.database.setMember(member, seasonDetails.season, timezone);
                const settingsRow = await this.database.fetchSettings(guild);
                if (settingsRow.role_id) await member.roles.add(settingsRow.role_id).catch(() => { });
                const replyOptions = DDDEmbed.createJoinEmbed(command, zoneDetails, seasonDetails).toReplyOptions();
                return command.followUp(replyOptions);
            }
            case 'leave': {
                await command.deferReply();
                const memberRow = await this.database.fetchMember(member, seasonDetails.season);
                const memberZoneDetails = memberRow ? DDDUtil.getZoneDetails(memberRow.timezone) : null;
                const allNutRows = await this.database.fetchAllNuts(member, seasonDetails.season);
                if (
                    (allNutRows.length) ||                                      // Already reported a DDD nut for current zone
                    (!memberZoneDetails || memberZoneDetails.isDecemberish)     // Existing Zone has already begun DDD or not joined
                ) { return command.followUp(DDDEmbed.createLeaveFailEmbed(command, seasonDetails, memberZoneDetails, allNutRows).toReplyOptions()); }
                await this.database.deleteMember(member);
                const replyOptions = DDDEmbed.createLeaveEmbed(command, memberZoneDetails, seasonDetails).toReplyOptions({ ephemeral: true });
                return command.followUp(replyOptions);
            }
            case 'settings': {
                if (!(channel instanceof TextChannel)) return command.reply(DDDEmbed.createNotTextChannelEmbed(command, seasonDetails).toReplyOptions({ ephemeral: true }));
                await command.deferReply();
                let settingsRow = await this.database.fetchSettings(guild);
                let memberRows = await this.database.fetchAllMembers(guild);
                const replyOptions = this.createControlPanelReplyOptions(command, seasonDetails, settingsRow, memberRows);
                const message = await command.followUp(replyOptions);
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', async (component: MessageComponentInteraction<'cached'>) => {
                    try {
                        if (component.isButton()) {
                            await component.deferUpdate();
                            switch (component.customId) {
                                case DDDButtonID.SET_EVENT_CHANNEL: {
                                    settingsRow = await this.database.setSettings(guild, { channel: channel });
                                    break;
                                }
                                case DDDButtonID.CLEAR_EVENT_CHANNEL: {
                                    settingsRow = await this.database.setSettings(guild, { channel: undefined });
                                    break;
                                }
                                case DDDButtonID.CREATE_EVENT_ROLE: {
                                    if (!settingsRow.role_id) {
                                        const role = await guild.roles.create({ name: 'DDD Participant', mentionable: true, reason: `Created by ${component.user.tag}` }).catch(() => null);
                                        if (role) {
                                            memberRows = await this.database.fetchAllMembers(guild);
                                            settingsRow = await this.database.setSettings(guild, { role: role });
                                            for (const memberRow of memberRows) {
                                                const member = guild.members.cache.get(memberRow.user_id.toString()) as GuildMember;
                                                await member.roles.add(settingsRow.role_id!).catch((err) => { console.log(err) }); // Do not await. Just do whenever...
                                            }
                                        }
                                    }
                                    break;
                                }
                                case DDDButtonID.DELETE_EVENT_ROLE: {
                                    if (settingsRow.role_id) {
                                        const role = await guild.roles.fetch(settingsRow.role_id.toString());
                                        if (role) await role.delete(`Deleted by ${component.user.tag}`);
                                        settingsRow = await this.database.setSettings(guild, { role: undefined });
                                    }
                                    break;
                                }
                            }
                            memberRows = await this.database.fetchAllMembers(guild);
                            const replyOptions = this.createControlPanelReplyOptions(command, seasonDetails, settingsRow, memberRows);
                            await component.editReply(replyOptions);
                        }
                    } catch{ }
                });
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                return message;
            }
            case 'nut': {
                await command.deferReply({ ephemeral: true });
                const memberRow = await this.database.fetchMember(member, seasonDetails.season);
                const memberZoneDetails = memberRow ? DDDUtil.getZoneDetails(memberRow.timezone) : null;
                const allNutRows = await this.database.fetchAllNuts(member, seasonDetails.season);
                if (
                    (!memberZoneDetails || !memberZoneDetails.isDecember)       // It is not december or they have not joined
                ) { return command.followUp(DDDEmbed.createNutFailEmbed(command, seasonDetails, memberZoneDetails).toReplyOptions()); }
                const description = command.options.getString('description') || undefined;
                allNutRows.push(await this.database.setNut(member, command.createdTimestamp.toString(), seasonDetails.season, description));
                const replyOptions = DDDEmbed.createNutEmbed(command, seasonDetails, memberZoneDetails, allNutRows).toReplyOptions();
                return command.followUp(replyOptions);
            }
        }
    }

    public createControlPanelReplyOptions(command: CommandInteraction, seasonDetails: DDDSeasonDetails, settingsRow: DDDSettingsRow, memberRows: DDDMemberRow[]) {
        const embed = DDDEmbed.createSettingsEmbed(command, seasonDetails, settingsRow, memberRows);
        const actionRow = new MessageActionRow().addComponents([
            ...(!settingsRow.channel_id ? [DDDButton.createUseChannelButton()] : []),
            ...(settingsRow.channel_id ? [DDDButton.createClearChannelButton()] : []),
            ...(!settingsRow.role_id ? [DDDButton.createCreateRoleButton()] : []),
            ...(settingsRow.role_id ? [DDDButton.createDeleteRoleButton()] : [])
        ]);
        return { embeds: [embed], components: [actionRow] };
    }

    public override async setup(client: HandlerClient): Promise<any> {
        return super.setup(client).then(() => this.database.createTables()).then(() => true);
    }
}
