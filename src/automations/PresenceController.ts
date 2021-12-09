import { ActivitiesOptions, Client } from 'discord.js';

export class PresenceController {

    private static TIMEOUT = {
        MIN: 1000 * 60 * 60 * 4, // 4 hours
        MAX: 1000 * 60 * 60 * 6 // 6 hours
    };

    private static ACTIVITIES: Array<ActivitiesOptions> = [
        { type: "COMPETING", name: " NNN 😄" },
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
        { type: "COMPETING", name: "your harem" },
        { type: "WATCHING", name: "for numbers" }
        // { type: "COMPETING", name: "for your love" } // "competing in"
    ];

    private readonly client: Client;
    private timeoutID: NodeJS.Timeout | null;

    private constructor(client: Client) {
        this.timeoutID = null;
        this.client = client;
    }

    private setPresenceTimeout(delay: number) {
        if (this.timeoutID) clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout(() => {
            if (this.client.user) {
                this.client.user.setPresence({
                    activities: [PresenceController.ACTIVITIES[PresenceController.ACTIVITIES.length * Math.random() << 0]!]
                });
            }
            const delta = PresenceController.TIMEOUT.MAX - PresenceController.TIMEOUT.MIN;
            const nextDelay = Math.floor(Math.random() * (delta + 1) + PresenceController.TIMEOUT.MIN);
            this.setPresenceTimeout(nextDelay);
        }, delay);
    }

    public static async setup(client: Client): Promise<PresenceController> {
        const manager = new PresenceController(client);
        if (!manager.timeoutID) {
            manager.setPresenceTimeout(0);
        }
        return manager;
    }
}
