import { ApplicationCommandData, ApplicationCommandPermissionData, AutocompleteInteraction, BaseCommandInteraction, Constants } from 'discord.js';
import { HandlerClient } from './HandlerClient';

const { ApplicationCommandTypes } = Constants;

export interface HandlerOptions {
    readonly id: string;
    readonly group: string;
    readonly nsfw?: boolean;
    readonly global?: boolean;
    readonly description?: string;
    readonly data: ApplicationCommandData;
    readonly permissions?: ApplicationCommandPermissionData[];
}

export abstract class Handler {

    public readonly id: string;
    public readonly group: string;
    public readonly nsfw: boolean;
    public readonly global: boolean;
    public readonly description?: string;
    public readonly data: ApplicationCommandData;
    public readonly permissions: ApplicationCommandPermissionData[];

    constructor(options: HandlerOptions) {
        this.id = options.id;
        this.group = options.group;
        this.nsfw = options.nsfw ?? false;
        this.global = options.global ?? false;
        this.description = options.description;
        this.data = options.data;
        this.permissions = options.permissions ?? [];
    }

    public abstract execute(interaction: BaseCommandInteraction): Promise<any>;
    public abstract autocomplete(interaction: AutocompleteInteraction): Promise<any>;

    public async initialise(_client: HandlerClient): Promise<any> { return null; }
    public async finalise(_client: HandlerClient): Promise<any> { return null; }
    public async setup(_client: HandlerClient): Promise<any> { return null; }

    public onNSFW(interaction: BaseCommandInteraction): Promise<any> {
        return interaction.followUp(`Sorry! ${interaction.commandName} can only be used in \`NSFW\` channels...`);
    }

    public onError(interaction: BaseCommandInteraction): Promise<any> {
        return interaction.followUp(`Sorry! ${interaction.commandName} seems to have run into an error...`);
    }

    public toString(): string {
        const prefix = (this.data.type === 'MESSAGE' || this.data.type === ApplicationCommandTypes.MESSAGE || this.data.type === 'USER' || this.data.type === ApplicationCommandTypes.USER) ? '☰ ' : '/'
        return `${prefix}${this.data.name}`
    }
}
