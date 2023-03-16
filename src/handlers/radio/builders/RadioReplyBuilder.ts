import { Collection } from 'discord.js';
import { ReplyBuilder } from '../../../core/builders/ReplyBuilder.js';
import { RadioStationAudioPlayer } from '../RadioStationAudioPlayer.js';
import { RadioMessageActionRowBuilder } from './RadioMessageActionRowBuilder.js';

export class RadioReplyBuilder extends ReplyBuilder {

    public addRadioEmbed(): this {
        const embed = this.createEmbedBuilder()
            .setDescription('pog');
        return this.addEmbeds(embed);
    }

    public addRadioButtonsActionRow(): this {
        const actionRow = new RadioMessageActionRowBuilder()
            .addJoinVoiceChannelButton();
        return this.addComponents(actionRow);
    }

    public addRadioStationsActionRow({ stations }: { stations: Collection<string, RadioStationAudioPlayer>; }): this {
        const actionRow = new RadioMessageActionRowBuilder()
            .addStationsSelectMenu({ stations });
        return this.addComponents(actionRow);
    }
}
