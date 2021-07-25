const { Command } = require('discord.js');

module.exports = class extends Command {
    constructor(client, options) {
        super(client, {
            name: 'RNG',
            json: require('./rng.json'),
            responses: {
                200: (interaction, options) => interaction.channel.send(options)
            }
        });
        this.subCommands = {
            flip: new(require('./sub_commands/flip'))(client, this, { upsidedown: options.upsidedown }),
            roll: new(require('./sub_commands/roll'))(client, this)
        }
    }

    execute(interaction) {
        switch (interaction.options[0].name) {
            case 'flip':
                return this.subCommands.flip.execute(interaction);
            case 'roll':
                return this.subCommands.roll.execute(interaction);
            default:
                return this.respond[501](interaction);
        }
    }
}
