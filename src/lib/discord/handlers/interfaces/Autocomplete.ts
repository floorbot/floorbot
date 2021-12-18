import { AutocompleteInteraction } from 'discord.js';

export interface Autocomplete {

    autocomplete(autocomplete: AutocompleteInteraction): Promise<any>;
}
