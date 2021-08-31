import { BooruCustomData, GuildHandler, GuildHandlerGroup, BooruHandlerOptions, BooruHandlerReply } from '../../..';
import { CommandInteraction, ButtonInteraction, Message, SelectMenuInteraction } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export abstract class BooruHandler extends GuildHandler<BooruCustomData> {

    constructor(options: BooruHandlerOptions) {
        super({ group: GuildHandlerGroup.BOORU, ...options });
    }

    public abstract generateResponse(context: HandlerContext, query: string): Promise<BooruHandlerReply>

    public override async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.deferReply();
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

    public override async onButton(interaction: ButtonInteraction, customData: any): Promise<any> {
        if (customData.m === 'e') { await interaction.deferUpdate() } else { await interaction.deferReply() }
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

    public override async onSelectMenu(interaction: SelectMenuInteraction, customData: any): Promise<any> {
        if (customData.m === 'e') { await interaction.deferUpdate() } else { await interaction.deferReply() }
        const response = await this.generateResponse(interaction, interaction.values[0]!);
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
