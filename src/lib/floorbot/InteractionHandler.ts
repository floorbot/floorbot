// import { AutocompleteInteraction, ChatInputCommandInteraction, CommandInteraction, ContextMenuCommandBuilder, SlashCommandBuilder } from 'discord.js';

// export abstract class InteractionHandler {


//     public readonly commandName: string = 'magick';

//     public readonly commands: SlashCommandBuilder[];

//     constructor(commands: SlashCommandBuilder[]) {
//         this.commands = commands;
//     }

//     public abstract run(): void;
// }



// export abstract class InteractionHandlerr {


//     public readonly command: SlashCommandBuilder;

//     constructor(command: SlashCommandBuilder) {
//         this.command = command;
//     }

//     public abstract run(cmd: ChatInputCommandInteraction): void;
// }


// export interface CommandHandler {
//     readonly commandData: SlashCommandBuilder | ContextMenuCommandBuilder;
//     run(command: CommandInteraction): Promise<void>;
// }

// export interface ChatInputHandler extends CommandHandler {
//     readonly commandData: SlashCommandBuilder;
//     run(command: ChatInputCommandInteraction): Promise<void>;
//     autocomplete?(autocomplete: AutocompleteInteraction): Promise<any>;
// }

// export class test implements ChatInputHandler {
//     commandData: SlashCommandBuilder = new SlashCommandBuilder();
//     run(command: ChatInputCommandInteraction): Promise<void> {
//         throw new Error('Method not implemented.');
//     }
// }
