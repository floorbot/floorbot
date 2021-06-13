const { Mixin, Util } = require('discord.js');
const DHMS = require('dhms.js');
const { Command } = Mixin;


module.exports = class extends Mixin(Command) {
    constructor(client) {
        super(client, {
            id: 'utils',
            name: 'Utils',
            group: 'utils',
            json: require('./utils.json')
        });
    }

    async onCommand(interaction) {
        const { client, guild, member, channel, webhook } = interaction;

        if (interaction.options.has('ping')) {
            await interaction.reply({ embeds: [this.getEmbedTemplate(interaction, { description: 'Pinging...' })] })
            const reply = await interaction.fetchReply();
            const embed = this.getEmbedTemplate(interaction)
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=0&scope=applications.commands%20bot`)
                .setThumbnail(client.user.displayAvatarURL())
                .setTitle(client.user.tag)
                .setDescription(
                    `Ping: **${DHMS.print(reply.createdTimestamp - interaction.createdTimestamp)}**\n` +
                    (client.ws.ping ? `Heartbeat: **${DHMS.print(Math.round(client.ws.ping))}**\n` : '') +
                    `Uptime: **${DHMS.print(client.uptime)}**`
                );
            return interaction.editReply({ embeds: [embed] });
        }

        if (interaction.options.has('guild')) {
            await interaction.defer({ ephemeral: false });
            return guild.bans.fetch({ cache: false }).catch(error => {
                if (error.message === 'Missing Permissions') return Promise.resolve(null);
                return Promise.reject(error);
            }).then(bans => {
                const embed = this.getEmbedTemplate(interaction, {
                    title: `${guild.name} Stats!`,
                    description: (
                        `Verified: **${guild.verified}**\n` +
                        `Region: **${guild.region}**\n` +
                        `Channels: **${guild.channels.cache.array().length}**\n` +
                        `Members: **${guild.memberCount}**\n` +
                        `Roles: **${guild.roles.cache.array().length}**\n` +
                        `Emojis: **${guild.emojis.cache.array().filter(emoji => !emoji.animated).length}**\n` +
                        `Gif Emojis: **${guild.emojis.cache.array().filter(emoji => emoji.animated).length}**\n` +
                        `Bans: **${bans ? bans.array().length : '*administrator permission*'}**\n` +
                        `Created: **${Util.formatDate(guild.createdAt)}**`
                    )
                })
                if (guild.icon) embed.setThumbnail(guild.iconURL({ dynamic: true }));
                if (guild.splash) embed.setImage(`${guild.splashURL({ dynamic: true, size: 4096 })}`);
                return webhook.send({ embeds: [embed] });
            })
        }

        if (interaction.options.has('invite')) {
            const embed = this.getEmbedTemplate(interaction)
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=0&scope=applications.commands%20bot`)
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription(`Make sure you have permissions to invite!`)
                .setTitle(`Invite ${client.user.tag}`);
            return interaction.reply({ embeds: [embed] });
        }

        if (interaction.options.has('screenshare')) {
            await interaction.defer({ ephemeral: false });
            const subCommand = interaction.options.get('screenshare');
            const channelID = subCommand?.options?.get('channel')?.value || member.voice.channel?.id;
            if (!channelID) return webhook.send({ embeds: [this.getEmbedTemplate(interaction, { description: 'Sorry! Please provide or join a voice channel 😦' })] });
            const voiceChannel = await client.channels.fetch(channelID);
            if (voiceChannel.type !== 'voice') return webhook.send({ embeds: [this.getEmbedTemplate(interaction, { description: `Sorry! ${voiceChannel} is not a voice channel... 😶` })] });
            return webhook.send({ embeds: [this.getEmbedTemplate(interaction, { description: `[Screenshare in ${voiceChannel}](${`https://discordapp.com/channels/${guild.id}/${voiceChannel.id}`})` })] });
        }
    }
}
