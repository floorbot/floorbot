const { Util } = require('discord.js');

module.exports = class {
    constructor(client, command) {
        this.client = client;
        this.command = command;
    }

    execute(interaction) {
        return interaction.acknowledge({ hideSource: true }).then(() => {
            const query = interaction.options?. [0]?.value || '1d6';
            const embed = this.command.getEmbedTemplate(interaction)
                .setTitle('Dice Rolls');

            // slice at 25 for embed max fields...
            const rolls = query.split(' ').slice(0, 25);
            for (let roll of rolls) {
                const matches = /(\d+)?d(\d+)/gi.exec(roll);
                if (!matches) {
                    embed.addField(roll, 'Error...');
                    continue;
                }
                const values = [];
                let total = 0;
                for (let i = 0; i < Math.min((matches[1] || 1), 10000); i++) {
                    const value = Math.ceil(Math.random() * Math.ceil(matches[2]));
                    values.push(Util.formatCommas(value));
                    total += value;
                }
                total = Util.formatCommas(total);
                roll = (matches[1] || 1) > 10000 ? `${roll} (max 10,000 rolls)` : roll;
                const text = Util.splitMessage(values.join(', '), {
                    maxLength: 1024 - 10 - total.toString().length,
                    append: '...',
                    char: ', '
                })[0];
                const description = `${text} \`Total: ${total}\``;
                const currentlength = embed.length + roll.length + description.length;
                const embedLimitField = {
                    name: 'Embed Limit',
                    value: 'Embed has reached the 6,000 character limit...\n' +
                        'Please consider smaller dice rolls'
                }
                const maxLength = 6000 - embedLimitField.name.length - embedLimitField.value.length;
                if (currentlength + text.length > maxLength) {
                    embed.addField(embedLimitField.name, embedLimitField.value);
                    break;
                }
                embed.addField(roll.toLowerCase(), description);
            }
            return this.command.respond[200](interaction, { embed });
        })
    }
}
