const { Handler } = require('discord.js');

module.exports = class Logger extends Handler {
    constructor(client, options = {}) {
        super(client, { id: 'logger', name: 'Logger', group: 'server' });
        this.enabled = options.enabled ?? true;

        client.on('log', (string, object) => {
            if (this.enabled) {
                string = Logger.processString(string);
                if (object) console.log(string, object);
                else console.log(string);
            }
        });
        client.on('error', error => {
            if (this.enabled) {
                const string = Logger.processString(`[Error] Discord client <${client.user.tag}> encountered an error`);
                console.error(string, error)
            };
        });
    }

    static processString(string) {
        string = `[${new Date().toLocaleString()}]${string}`;
        string = string.replace(/(\s|^)(?=\d+(?:\s|$))/gm, ' \x1b[33m'); // integers start colour
        string = string.replace(/(?<=(?:\s|^)(?:\u001b\[\d+m)?\d+)($|\s)/gm, '\x1b[0m '); // integers stop clear
        string = string.replace(/(?<=[^\u001b]|^)\[/gm, '[\x1b[35m').replace(/\]/gm, '\x1b[0m]'); // [] (accounting for colour square brackets)
        string = string.replace(/\{/gm, '{\x1b[95m').replace(/\}/gm, '\x1b[0m}'); // {}
        string = string.replace(/\(/gm, '(\x1b[91m').replace(/\)/gm, '\x1b[0m)'); // ()
        string = string.replace(/\</gm, '<\x1b[31m').replace(/\>/gm, '\x1b[0m>'); // <>
        return string;
    }
}
