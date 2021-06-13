const UrbanDictionaryApi = require('./urban-dictionary-api');
const { Util, Mixin } = require('discord.js');
const { Command } = Mixin;

module.exports = class extends Mixin(Command) {

    constructor(client) {
        super(client, {
            id: 'define',
            name: 'Define',
            group: 'define',
            json: require('./define.json')
        });
    }

    getEmbedTemplate(interaction, data) {
        return super.getEmbedTemplate(interaction, data)
            .setFooter('Powered by Urban Dictionary', 'https://miro.medium.com/max/4000/1*ctUugc4pAxlLweBOxzySLg.png');
    }

    async onCommand(interaction) {
        await interaction.defer();
        const query = interaction.options.get('query')?.value ?? String();
        const method = query.length ? 'define' : 'random';
        const escapedQuery = Util.escapeMarkdown(query);
        const res = await UrbanDictionaryApi[method](query);
        if (!res.list.length) return interaction.webhook.send(this.getEmbedTemplate(interaction, { description: `Sorry! I could not define \`${query}\` 😟` }));
        const best = res.list.reduce((first, second) => first.thumbs_up / first.thumbs_down > second.thumbs_up / second.thumbs_down ? first : second);
        const first = res.list[0];
        const definition = method === 'define' ? first : best;
        const embed = this.getEmbedTemplate(interaction, {
            title: `${definition.word} (${escapedQuery || 'Random'})`,
            url: definition.permalink,
            description: Util.splitMessage(definition.definition.replace(/(\[|\])/g, '*'), { maxLength: 2048, char: '', append: '...' })[0],
            embeds: (definition.example.length ? [{
                title: 'Example',
                value: Util.splitMessage(definition.example.replace(/(\[|\])/g, '*'), { maxLength: 1024, char: '', append: '...' })[0]
            }] : [])
        })
        return interaction.webhook.send(embed);
    }
}
