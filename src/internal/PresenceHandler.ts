import { BaseHandler, CommandClient } from 'discord.js-commands';
import { ActivitiesOptions } from 'discord.js';

export class PresenceHandler extends BaseHandler {

    private static TIMEOUT = {
        MIN: 1000 * 60 * 60 * 4, // 4 hours
        MAX: 1000 * 60 * 60 * 6 // 6 hours
    }

    private static ACTIVITIES: Array<ActivitiesOptions> = [
        { type: "LISTENING", name: "japan asmr" },
        { type: "LISTENING", name: "soft loli breathing" },
        { type: "LISTENING", name: "to the rain" },
        { type: "LISTENING", name: "to you" },
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
        { type: "COMPETING", name: "for your love" }
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

    public async initialise(): Promise<any> {
        if (!this.timeoutID) {
            this.setPresenceTimeout(0);
            return true;
        }
    }

    public async finalise(): Promise<any> {
        if (this.timeoutID) {
            clearTimeout(this.timeoutID);
            this.timeoutID = null;
            return true;
        }
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
