// import { BaseHandler, HandlerOptions } from 'discord.js-commands';
//
// export enum FloorbotHandlerGroup {
//     ADMIN = 'admin',
//     BOORU = 'booru',
//     FUN = 'fun'
// }
//
// export interface FloorbotHandlerOptions extends HandlerOptions {
//     readonly group: FloorbotHandlerGroup
// }
//
// export class FloorbotHandler extends BaseHandler {
//
//     public readonly group: FloorbotHandlerGroup;
//
//     constructor(options: FloorbotHandlerOptions) {
//         super(options);
//         this.group = options.group;
//     }
//
//
//
//     // public abstract isEnabled(guild ?: Guild): Promise<boolean>;
//     // public abstract enable(guild ?: Guild): Promise<ApplicationCommand | null>;
//     // public abstract disable(guild ?: Guild): Promise<ApplicationCommand | null>;
//     // public abstract hasPermission(context: HandlerContext): Promise<boolean>;
//     // public abstract fetchCommand(guild ?: Guild): Promise<ApplicationCommand | null>;
// }
