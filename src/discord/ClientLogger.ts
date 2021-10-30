import { Client } from 'discord.js';

export class ClientLogger {

    public static setup(client: Client): void {
        client.on('log', (string, object) => ClientLogger.onLogEvent(client, string, object));
        client.on('error', (error) => ClientLogger.onErrorEvent(client, error));
    }

    private static onLogEvent(_client: Client, string: string, object: any): void {
        string = ClientLogger.processString(string);
        if (object) console.log(string, object);
        else console.log(string);
    }

    private static onErrorEvent(client: Client, error: Error): void {
        const string = ClientLogger.processString(`[Error] Discord client <${client.user!.tag}> encountered an error`);
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
