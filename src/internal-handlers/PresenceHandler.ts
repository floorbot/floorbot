import { BaseHandler, CommandClient, SetupResult } from 'discord.js-commands';
import { ActivitiesOptions } from 'discord.js';

export class PresenceHandler extends BaseHandler {

    private static TIMEOUT = {
        MIN: 1000 * 60 * 60 * 4, // 4 hours
        MAX: 1000 * 60 * 60 * 6 // 6 hours
    }

    private static ACTIVITIES: Array<ActivitiesOptions> = [
        { type: "LISTENING", name: "japan asmr" },
        { type: "LISTENING", name: "soft loli breathing" },
        { type: "LISTENING", name: "the rain" },
        { type: "LISTENING", name: "you" },
        { type: "WATCHING", name: "anime" },
        { type: "WATCHING", name: "for feet" },
        { type: "WATCHING", name: "hentai" },
        { type: "WATCHING", name: "hentai again" },
        { type: "WATCHING", name: "more hentai" },
        { type: "WATCHING", name: "the weather" },
        { type: "WATCHING", name: "the clouds" },
        { type: "PLAYING", name: "on the floor" },
        { type: "PLAYING", name: "with the carpet" },
        { type: "PLAYING", name: "with ur mum" },
        { type: "COMPETING", name: "your harem" }
        // { type: "COMPETING", name: "for your love" } // "competing in"
    ]

    private timeoutID: NodeJS.Timeout | null;

    constructor(client: CommandClient) {
        super(client, {
            id: 'presence',
            name: 'Presence',
            group: 'Internal',
            nsfw: false
        });

        this.timeoutID = null;
    }

    public async initialise(): Promise<SetupResult | null> {
        if (!this.timeoutID) {
            this.setPresenceTimeout(0);
            return { message: 'Started presence update timout' }
        }
        return null;
    }

    public async finalise(): Promise<SetupResult | null> {
        if (this.timeoutID) {
            clearTimeout(this.timeoutID);
            this.timeoutID = null;
            return { message: 'Ended presence update timout' }
        }
        return null;
    }

    private setPresenceTimeout(delay: number) {
        if (this.timeoutID) clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout(() => {
            if (this.client.user) {
                this.client.user.setPresence({
                    activities: [PresenceHandler.ACTIVITIES[PresenceHandler.ACTIVITIES.length * Math.random() << 0]]
                });
            }
            const delta = PresenceHandler.TIMEOUT.MAX - PresenceHandler.TIMEOUT.MIN;
            const nextDelay = Math.floor(Math.random() * (delta + 1) + PresenceHandler.TIMEOUT.MIN);
            this.setPresenceTimeout(nextDelay);
        }, delay);
    }
}
