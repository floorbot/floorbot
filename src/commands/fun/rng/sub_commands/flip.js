const { Util } = require('discord.js');

module.exports = class {
    constructor(client, command, options) {
        this.client = client;
        this.command = command;
        this.upsidedown = options.upsidedown;
    }

    execute(interaction) {
        const { channel } = interaction;
        if (interaction.options[0].options[0].name === 'coin') {
            return interaction.acknowledge({ hideSource: true }).then(() => {
                const count = interaction.options[0].options[0]?.options?. [0]?.value || 1
                const heads = Math.round(this.random_bm() * count);
                const embed = this.command.getEmbedTemplate(interaction)
                    .setTitle(`You flipped ${Util.formatCommas(count)} coin${count > 1 ? 's' : ''}`)
                    .addField('Heads', Util.formatCommas(heads), true)
                    .addField('Tails', Util.formatCommas(count - heads), true);
                return this.command.respond[200](interaction, { embed });
            })
        }
        if (interaction.options[0].options[0].name === 'text') {
            return interaction.acknowledge({ hideSource: false }).then(() => {
                const text = interaction.options[0].options[0]?.options?. [0]?.value || member.displayName;
                const chars = text.split('').map(char => {
                    const reverse = Object.keys(this.upsidedown).find(key => this.upsidedown[key] === char);
                    return reverse || (this.upsidedown[char] ? this.upsidedown[char] : char);
                }).reverse();
                return this.command.respond[200](interaction, { content: `(╯°□°）╯︵ ${chars.join('')}` });
            })
        }
    }

    // Standard Normal variate using Box-Muller transform.
    random_bm() {
        let u = 0;
        let v = 0;
        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = Math.random(); //Converting [0,1) to (0,1)
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return num / 10.0 + 0.5;
    }
}
