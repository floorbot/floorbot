import { GuildCommandHandlerGroup, GuildCommandHandler, BooruCustomData, BooruHandlerOptions, BooruResponseFactory, BooruEmbedFactory, BooruSelectMenuFactory, BooruButtonFactory } from '../../..'
import { CommandInteraction, ButtonInteraction, Message, SelectMenuInteraction } from 'discord.js';
import { ButtonHandler, SelectMenuHandler } from 'discord.js-commands';

export abstract class BooruHandler extends GuildCommandHandler implements ButtonHandler<BooruCustomData>, SelectMenuHandler<BooruCustomData> {

    public abstract override readonly responseFactory: BooruResponseFactory;

    public readonly selectMenuFactory: BooruSelectMenuFactory;
    public readonly buttonFactory: BooruButtonFactory
    public readonly embedFactory: BooruEmbedFactory;

    constructor(options: BooruHandlerOptions) {
        super({
            id: options.id,
            nsfw: options.nsfw,
            commandData: options.commandData,
            group: GuildCommandHandlerGroup.BOORU,
        });
        this.selectMenuFactory = new BooruSelectMenuFactory(this);
        this.buttonFactory = new BooruButtonFactory(this);
        this.embedFactory = new BooruEmbedFactory(this);
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();
        const query = (interaction.options.get('tags') || interaction.options.get('thread'));
        const queryString = query ? query.value!.toString().replace(/ /g, '+') : '';
        const response = await this.responseFactory.generateResponse(interaction, queryString);
        return interaction.followUp(response).then(sent => {
            if (response.imageURL) {
                const webmp4 = /(\.webm)|(\.mp4)/g.test(response.imageURL);
                if (webmp4) return interaction.followUp({ content: response.imageURL });
            }
            return sent;
        });
    }

    public async onButton(interaction: ButtonInteraction, customData: BooruCustomData): Promise<any> {
        if (customData.wl && customData.wl !== interaction.user.id) {
            return interaction.reply(this.responseFactory.getWhitelistRecycleResponse(interaction));
        }
        if (customData.m === 'e') { await interaction.deferUpdate() } else { await interaction.defer() }
        const response = await this.responseFactory.generateResponse(interaction, customData.t);
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

    public async onSelectMenu(interaction: SelectMenuInteraction, customData: BooruCustomData): Promise<any> {
        if (customData.wl && customData.wl !== interaction.user.id) {
            return interaction.reply(this.responseFactory.getWhitelistSuggestionResponse(interaction));
        }
        if (customData.m === 'e') { await interaction.deferUpdate() } else { await interaction.defer() }
        const response = await this.responseFactory.generateResponse(interaction, interaction.values[0]!);
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
