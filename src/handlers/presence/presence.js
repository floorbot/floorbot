const { Handler } = require('discord.js');

module.exports = class Presences extends Handler {

    constructor(client) {
        super(client, { id: 'presence', ame: 'Presence', group: 'server' });
        const data = require('./presence-data');
        this.activities = data.activities || [];
        this.timeout = data.timeout || 0;
        this.timeoutID = null;
    }

    initialise() {
        if (!this.timeoutID) {
            this.setPresenceTimeout(0);
            return true;
        }
    }

    finalise() {
        if (this.timeoutID) {
            clearTimeout(this.timeoutID);
            this.timeoutID = null;
            return true;
        }
    }

    setPresenceTimeout(delay) {
        if (this.timeoutID) clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout(() => {
            this.client.user.setPresence({
                activities: [this.activities[this.activities.length * Math.random() << 0]]
            });
            const delta = this.timeout.max - this.timeout.min;
            const nextDelay = Math.floor(Math.random() * (delta + 1) + this.timeout.min);
            this.setPresenceTimeout(nextDelay);
        }, delay);
    }
}
