import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, MessageActionRowComponentBuilder, StringSelectMenuBuilder } from 'discord.js';
import { RadioStationAudioPlayer } from '../RadioStationAudioPlayer.js';

export enum RadioButtonId {
    JoinChannel = 'join_channel'
}

export enum RadioSelectMenuId {
    Station = 'station'
}

export class RadioMessageActionRowBuilder extends ActionRowBuilder<MessageActionRowComponentBuilder> {

    public addJoinVoiceChannelButton(): this {
        const button = new ButtonBuilder()
            .setCustomId(RadioButtonId.JoinChannel)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Join Channel');
        return this.addComponents(button);
    }

    public addStationsSelectMenu({ stations }: { stations: Collection<string, RadioStationAudioPlayer>; }): this {
        const options = stations.map((station, key) => {
            return { value: key, label: station.name, description: station.description };
        });
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(RadioSelectMenuId.Station)
            .setPlaceholder('Please select a station to play')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(options);
        return this.addComponents(selectMenu);
    }
}
