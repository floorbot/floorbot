import { CommandInteraction, ButtonInteraction, ApplicationCommandData, InteractionReplyOptions, Message, SelectMenuInteraction } from 'discord.js';
import { BaseHandler, CommandClient, CommandHandler, ButtonHandler, SelectMenuHandler, HandlerContext } from 'discord.js-commands';
import { WhitelistSuggestionEmbed } from './message/embeds/WhitelistSuggestionEmbed';
import { WhitelistRecycleEmbed } from './message/embeds/WhitelistRecycleEmbed';

export interface BooruComponentCustomData {
    readonly m: 'p' | 'e',
    readonly t: string,
    readonly wl: string | null
}

export interface BooruHandlerOptions {
    readonly id: string,
    readonly name: string,
    readonly nsfw: boolean
}

export interface BooruHandlerReply extends InteractionReplyOptions {
    readonly imageURL?: string
}

export abstract class BooruHandler extends BaseHandler implements CommandHandler, ButtonHandler, SelectMenuHandler {

    public readonly commandData: ApplicationCommandData;
    public readonly isGlobal: boolean;

    constructor(client: CommandClient, options: BooruHandlerOptions, commandData: ApplicationCommandData) {
        super(client, {
            group: 'Booru',
            id: options.id,
            name: options.name,
            nsfw: options.nsfw
        });
        this.commandData = commandData;
        this.isGlobal = false;
    }

    public abstract generateResponse(context: HandlerContext, query: string): Promise<BooruHandlerReply>

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();
        const query = (interaction.options.get('tags') || interaction.options.get('thread'));
        const queryString = query ? query.value!.toString().replace(/ /g, '+') : '';
        const response = await this.generateResponse(interaction, queryString);
        return interaction.followUp(response).then(sent => {
            if (response.imageURL) {
                const webmp4 = /(\.webm)|(\.mp4)/g.test(response.imageURL);
                if (webmp4) return interaction.followUp({ content: response.imageURL });
            }
            return sent;
        });
    }

    public async onButton(interaction: ButtonInteraction, customData: any): Promise<any> {
        if (customData.wl && customData.wl !== interaction.user.id) {
            return interaction.reply({
                embeds: [new WhitelistRecycleEmbed(this.getEmbedTemplate(interaction), this)],
                components: [],
                ephemeral: true
            })
        }
        if (customData.m === 'e') { await interaction.deferUpdate() } else { await interaction.defer() }
        const response = await this.generateResponse(interaction, customData.t);
        return new Promise(resolve => {
            if (customData.m === 'p') return resolve(interaction.followUp(response));
            if (customData.m === 'e') return resolve((<Message>interaction.message).edit(response));
        }).then(sent => {
            if (response.imageURL) {
                const webmp4 = /(\.webm)|(\.mp4)/g.test(response.imageURL);
                if (webmp4) return interaction.followUp({ content: response.imageURL });
            }
            return sent;
        });
    }

    public async onSelectMenu(interaction: SelectMenuInteraction, customData: any): Promise<any> {
        if (customData.wl && customData.wl !== interaction.user.id) {
            return interaction.reply({
                embeds: [new WhitelistSuggestionEmbed(this.getEmbedTemplate(interaction), this)],
                components: [],
                ephemeral: true
            })
        }
        if (customData.m === 'e') { await interaction.deferUpdate() } else { await interaction.defer() }
        const response = await this.generateResponse(interaction, interaction.values[0]);
        return new Promise(resolve => {
            if (customData.m === 'p') return resolve(interaction.followUp(response));
            if (customData.m === 'e') return resolve((<Message>interaction.message).edit(response));
        }).then(sent => {
            if (response.imageURL) {
                const webmp4 = /(\.webm)|(\.mp4)/g.test(response.imageURL);
                if (webmp4) return interaction.followUp({ content: response.imageURL });
            }
            return sent;
        });
    }
}
