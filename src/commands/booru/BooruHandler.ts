import { ApplicationCommandData, Interaction, InteractionReplyOptions, Message, MessageComponentInteraction } from 'discord.js';
import { HandlerContext } from '../../discord/Util';
import { BaseHandler } from '../BaseHandler';
import { BooruEmbed } from './BooruEmbed';

export interface BooruHandlerOptions {
    readonly data: ApplicationCommandData
    readonly nsfw: boolean,
    readonly id: string,
    readonly apiName: string,
    readonly apiIcon: string
}

export interface BooruSuggestionData {
    readonly suggestions: Array<{
        readonly name: string,
        readonly count: number
    }>,
    readonly tags: string,
    readonly url404: string | null
}

export abstract class BooruHandler extends BaseHandler {

    public readonly apiName: string;
    public readonly apiIcon: string;

    constructor(options: BooruHandlerOptions) {
        super({ group: 'Booru', global: false, ...options });
        this.apiName = options.apiName;
        this.apiIcon = options.apiIcon;
    }

    public abstract generateResponse(context: HandlerContext, query: string): Promise<InteractionReplyOptions>

    public override async execute(interaction: Interaction): Promise<any> {
        if (interaction.isCommand()) {
            await interaction.deferReply();
            const query = (interaction.options.get('tags') || interaction.options.get('thread'));
            let queryString = query ? query.value!.toString().replace(/ /g, '+') : '';
            const response = await this.generateResponse(interaction, queryString);
            let message = await interaction.followUp(response) as Message;
            const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
            collector.on('collect', this.createCollectorFunction(message, queryString));
            collector.on('end', async () => {
                try {
                    const embed = message.embeds[0] as BooruEmbed;
                    embed.footer!.text += ' - 🔒 Locked';
                    embed.setThumbnail(embed.image!.url);
                    embed.image = null;
                    const replyOptions = {
                        embeds: [embed],
                        components: [],
                    }
                    await message.edit(replyOptions);
                } catch { }
            });
        }
    }

    private createCollectorFunction(message: Message, queryString: string) {
        return async (interaction: MessageComponentInteraction) => {
            if (interaction.isSelectMenu()) {
                await interaction.deferUpdate();
                queryString = interaction.values[0] || '';
                const response = await this.generateResponse(interaction, queryString);
                message = await (<Message>interaction.message).edit(response);
            }
            if (interaction.isButton() && interaction.customId === 'recycle') {
                if (message.interaction && interaction.user !== message.interaction.user) {
                    await interaction.reply({ content: `Sorry! Only the creator of this search can recycle the image`, ephemeral: true });
                } else {
                    await interaction.deferUpdate();
                    const response = await this.generateResponse(interaction, queryString);
                    message = await (<Message>interaction.message).edit(response);
                }
            }
            if (interaction.isButton() && interaction.customId === 'delete') {
                if (message.interaction && interaction.user !== message.interaction.user) {
                    await interaction.reply({ content: `Sorry! Only the creator of this search can delete the image`, ephemeral: true });
                } else {
                    await interaction.deferUpdate();
                    await (<Message>interaction.message).delete().catch(_err => { });
                }
            }
            if (interaction.isButton() && interaction.customId === 'repeat') {
                await interaction.deferReply();
                const response = await this.generateResponse(interaction, queryString);
                const followUp = await interaction.followUp(response) as Message;
                const collector = followUp.createMessageComponentCollector({ idle: 1000 * 60 * 10 })
                collector.on('collect', this.createCollectorFunction(followUp, queryString));
                collector.on('end', this.createEnderFunction(message));
            }
        }
    }
}
