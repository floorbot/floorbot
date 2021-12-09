export type LogFunction = (...data: any[]) => void;

export default function consolePrettifier(next: LogFunction): LogFunction {
    return (...data: any[]) => {
        for (const [index, part] of data.entries()) {
            if (typeof part === 'string') {
                let string = part;
                string = `[${new Date().toLocaleString()}]${string}`;
                string = string.replace(/(\s|^)(?=\d+(?:\s|$))/gm, ' \x1b[33m'); // integers start colour
                string = string.replace(/(?<=(?:\s|^)(?:\u001b\[\d+m)?\d+)($|\s)/gm, '\x1b[0m '); // integers stop clear
                string = string.replace(/(?<=[^\u001b]|^)\[/gm, '[\x1b[35m').replace(/\]/gm, '\x1b[0m]'); // [] (accounting for colour square brackets)
                string = string.replace(/\{/gm, '{\x1b[95m').replace(/\}/gm, '\x1b[0m}'); // {}
                string = string.replace(/\(/gm, '(\x1b[91m').replace(/\)/gm, '\x1b[0m)'); // ()
                string = string.replace(/\</gm, '<\x1b[31m').replace(/\>/gm, '\x1b[0m>'); // <>
                data[index] = string;
            }
        }
        next(...data);
    }
}
