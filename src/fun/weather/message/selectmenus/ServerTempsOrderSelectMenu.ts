import { ServerTempsEmbedOrder } from '../embeds/ServerTempsEmbed';
import { WeatherSubCommandName } from '../../WeatherCommandData'
import { MessageSelectMenu } from 'discord.js';

export class ServerTempsOrderSelectMenu extends MessageSelectMenu {

    constructor(selected: ServerTempsEmbedOrder) {
        super();

        this.addOptions(Object.values(ServerTempsEmbedOrder).map(orderName => {
            return {
                label: `Order by ${orderName}`,
                default: orderName === selected,
                value: orderName
            }
        }))

        this.setCustomId(JSON.stringify({
            id: 'weather',
            sub: WeatherSubCommandName.SERVER_TEMPS
        }));
    }
}
