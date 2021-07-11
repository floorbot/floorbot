import { ApplicationCommandData, CommandInteraction, Util, Message, MessageOptions, MessageButton, MessageActionRow, Constants, ButtonInteraction } from 'discord.js';
import { CommandClient, BaseHandler, CommandHandler, ButtonHandler, HandlerContext } from 'discord.js-commands';
import { UrbanDictionaryAPI } from './UrbanDictionaryAPI';
import { DefineCommandData } from './DefineCommandData'
const { MessageButtonStyles } = Constants;

interface DefineData {
    readonly query?: string
    readonly page: number
}

export class DefineHandler extends BaseHandler implements CommandHandler, ButtonHandler {

    public readonly commandData: ApplicationCommandData;
    public readonly isGlobal: boolean;

    constructor(client: CommandClient) {
        super(client, { id: 'define', name: 'Define', group: 'Fun', nsfw: false });
        this.commandData = DefineCommandData;
        this.isGlobal = false;
    }

    public async onButton(interaction: ButtonInteraction, customData: any): Promise<any> {
        await interaction.deferUpdate();
        const response = await this.fetchResponse(interaction, customData);
        return (<Message>interaction.message).edit(response);
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();
        if (interaction.options.has('query')) {
            const query = interaction.options.get('query')!.value!.toString();
            const response = await this.fetchResponse(interaction, { query: query, page: 0 });
            return interaction.followUp(response);
        } else {
            const response = await this.fetchResponse(interaction, { page: 0 });
            return interaction.followUp(response);
        }
    }

    public getEmbedTemplate(context: HandlerContext) {
        return super.getEmbedTemplate(context)
            .setFooter('Powered by Urban Dictionary', 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg');
    }

    private async fetchResponse(context: HandlerContext, defineData: DefineData): Promise<MessageOptions> {
        if (defineData.query) {
            const term = Util.escapeMarkdown(defineData.query);
            const definitions = await UrbanDictionaryAPI.define(term);
            if (!definitions.length) {
                const embed = this.getEmbedTemplate(context).setDescription(
                    `Sorry! I could not define \`${term}\` 😟\n` +
                    '*Please check your spelling or try another word!*'
                )
                return { embeds: [embed] };
            }
            const page = defineData.page % definitions.length;
            const definition = definitions[page];
            const embed = this.getEmbedTemplate(context)
                .setTitle(`${definition.word}`)
                .setURL(definition.permalink)
                .setDescription(Util.splitMessage(definition.definition.replace(/(\[|\])/g, '*'), { maxLength: 2048, char: '', append: '...' })[0])
                .setFooter(`${page + 1}/${definitions.length} - Powered by Urban Dictionary`, 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg')
            if (definition.example.length) {
                embed.addField('Example', Util.splitMessage(definition.example.replace(/(\[|\])/g, '*'), { maxLength: 1024, char: '', append: '...' })[0]);
            }
            const actionRow = new MessageActionRow().addComponents([
                new MessageButton()
                    .setLabel('Previous')
                    .setStyle(MessageButtonStyles.PRIMARY)
                    .setCustomId(JSON.stringify({ id: this.id, query: defineData.query, page: page - 1 })),
                new MessageButton()
                    .setLabel('Next')
                    .setStyle(MessageButtonStyles.PRIMARY)
                    .setCustomId(JSON.stringify({ id: this.id, query: defineData.query, page: page + 1 }))
            ])
            return { embeds: [embed], components: [actionRow] };
        } else {
            const definitions = await UrbanDictionaryAPI.random();
            const definition = definitions[defineData.page];
            const embed = this.getEmbedTemplate(context)
                .setTitle(`${definition.word}`)
                .setURL(definition.permalink)
                .setDescription(Util.splitMessage(definition.definition.replace(/(\[|\])/g, '*'), { maxLength: 2048, char: '', append: '...' })[0]);
            if (definition.example.length) {
                embed.addField('Example', Util.splitMessage(definition.example.replace(/(\[|\])/g, '*'), { maxLength: 1024, char: '', append: '...' })[0]);
            }
            return { embeds: [embed] };
        }
    }
}
