import { AutocompleteInteraction } from 'discord.js';

export interface Autocomplete {

    autocomplete(interaction: AutocompleteInteraction): Promise<any>;
}
