/**
 * Represents the logger type to use in the prettifier function
 *
 * @see prettifyConsole
 */
export type LoggerFunction = (...data: any[]) => void;

/**
 * Adds colour to content within different brackets for all strings passed to a given logger
 *
 * @param logger The logger/function to prettify
 * @returns The logger wrapped by the prettifier
 */
export default function prettifyConsole(logger: LoggerFunction): LoggerFunction {
    return (...data: any[]) => {
        for (const [index, part] of data.entries()) {
            if (typeof part === 'string') {
                let string = part;
                if (!index) string = `[${new Date().toLocaleString()}]${string}`;
                string = string.replace(/(\s|^)(?=\d+(?:\s|$))/gm, ' \x1b[33m'); // integers start colour
                string = string.replace(/(?<=(?:\s|^)(?:\u001b\[\d+m)?\d+)($|\s)/gm, '\x1b[0m '); // integers stop colour
                string = string.replace(/(?<=[^\u001b]|^)\[/gm, '[\x1b[35m').replace(/\]/gm, '\x1b[0m]'); // [] (accounting for colour square brackets)
                string = string.replace(/\{/gm, '{\x1b[95m').replace(/\}/gm, '\x1b[0m}'); // {}
                string = string.replace(/\(/gm, '(\x1b[91m').replace(/\)/gm, '\x1b[0m)'); // ()
                string = string.replace(/\</gm, '<\x1b[31m').replace(/\>/gm, '\x1b[0m>'); // <>
                data[index] = string;
            }
        }
        logger(...data);
    };
}