import { ActivitiesOptions, ActivityType, Client } from 'discord.js';

export class PresenceController {

    private static TIMEOUT = {
        MIN: 1000 * 60 * 60 * 4, // 4 hours
        MAX: 1000 * 60 * 60 * 6 // 6 hours
    };

    private static ACTIVITIES: Array<ActivitiesOptions> = [
        { type: ActivityType.Competing, name: " NNN 😄" },
        { type: ActivityType.Listening, name: "japan asmr" },
        { type: ActivityType.Listening, name: "soft loli breathing" },
        { type: ActivityType.Listening, name: "the rain" },
        { type: ActivityType.Listening, name: "you" },
        { type: ActivityType.Watching, name: "anime" },
        { type: ActivityType.Watching, name: "for feet" },
        { type: ActivityType.Watching, name: "hentai" },
        { type: ActivityType.Watching, name: "hentai again" },
        { type: ActivityType.Watching, name: "more hentai" },
        { type: ActivityType.Watching, name: "the weather" },
        { type: ActivityType.Watching, name: "the clouds" },
        { type: ActivityType.Playing, name: "on the floor" },
        { type: ActivityType.Playing, name: "with the carpet" },
        { type: ActivityType.Playing, name: "with ur mum" },
        { type: ActivityType.Playing, name: "your harem" },
        { type: ActivityType.Playing, name: "for numbers" }
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
