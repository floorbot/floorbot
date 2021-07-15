import { BaseHandler, CommandClient } from 'discord.js-commands';

export class LoggerHandler extends BaseHandler {

    constructor(client: CommandClient) {
        super(client, {
            id: 'logger',
            name: 'Logger',
            group: 'Internal',
            nsfw: false
        });

        client.on('log', this.onLog);
        client.on('error', this.onError);
    }

    private onLog(string: string, object: any): void {
        string = LoggerHandler.processString(string);
        if (object) console.log(string, object);
        else console.log(string);
    }

    private onError(error: Error): void {
        const string = LoggerHandler.processString(`[Error] Discord client <${this.client.user!.tag}> encountered an error`);
        console.error(string, error)
    }

    private static processString(string: string): string {
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
