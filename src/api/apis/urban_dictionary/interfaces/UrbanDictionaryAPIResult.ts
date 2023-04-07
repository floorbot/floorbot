import { UrbanDictionaryAPIAutocomplete } from './UrbanDictionaryAPIAutocomplete.js';
import { UrbanDictionaryAPIDefinition } from './UrbanDictionaryAPIDefinition.js';

export interface UrbanDictionaryAPIResult {
    list?: UrbanDictionaryAPIDefinition[],
    results?: UrbanDictionaryAPIAutocomplete[];
}
