const Markov = require('markov-strings').default
const { Mixin } = require('discord.js');
const { Command } = Mixin;

const userSQL = 'SELECT content FROM message WHERE channel_id = ? AND message_id IN (SELECT message_id FROM message_author WHERE author_id = ?);';
const channelSQL = 'SELECT * FROM message WHERE channel_id = ?;'

module.exports = class extends Mixin(Command) {

    constructor(client, options) {
        super(client, Object.assign({
            id: 'markov',
            name: 'Markov',
            group: 'markov',
            json: require('./markov.json')
        }, options));
        this.pool = options.pool;
    }

    async onCommand(interaction) {
        await interaction.defer();
        const userID = interaction?.options[0]?.value || null;
        const sql = userID ? userSQL : channelSQL;

        return this.pool.query(sql, [interaction.channel.id, userID]).catch(err => {
            this.client.emit('log', '[Markov] Database error', error)
            return Promise.reject(error);
        }).then(rows => {
            const data = rows.map(row => row.content).filter(content => content.length);
            if (!data.length) return interaction.followUp(this.getEmbedTemplate(interaction, {
                description: 'Sorry! I could not find any messages in this channel'
            }));

            const markov = new Markov({ stateSize: 1 });
            markov.addData(data);

            const minLength = Math.floor(Math.random() * 10)
            const options = {
                maxTries: 100,
                prng: Math.random,
                filter: (result) => {
                    return (
                        result.refs.length > 1 &&
                        result.string.split(' ').length > minLength
                    );
                }
            }
            const res = markov.generate(options);
            return interaction.followUp(res.string);
        });
    }
}
