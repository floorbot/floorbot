import { CommandClient, HandlerResult } from 'discord.js-commands';
import { InternalHandler } from '../..';

export class LoggerHandler extends InternalHandler {


    constructor() {
        super({ id: 'logger', nsfw: false });
    }

    public override async setup(client: CommandClient): Promise<HandlerResult> {
        client.on('log', (string, object) => this.onLog(client, string, object));
        client.on('error', (error) => this.onError(client, error));
        return { message: 'Added log and error listeners' };
    }

    private onLog(_client: CommandClient, string: string, object: any): void {
        string = LoggerHandler.processString(string);
        if (object) console.log(string, object);
        else console.log(string);
    }

    private onError(client: CommandClient, error: Error): void {
        const string = LoggerHandler.processString(`[Error] Discord client <${client.user!.tag}> encountered an error`);
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
