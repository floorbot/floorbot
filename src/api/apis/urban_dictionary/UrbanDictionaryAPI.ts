import { API, APIOptions, RequestOptions } from '../../../api/API.js';
import { UrbanDictionaryAPIAutocomplete } from './interfaces/UrbanDictionaryAPIAutocomplete.js';
import { UrbanDictionaryAPIDefinition } from './interfaces/UrbanDictionaryAPIDefinition.js';
import { UrbanDictionaryAPIResult } from './interfaces/UrbanDictionaryAPIResult.js';

export { UrbanDictionaryAPIAutocomplete, UrbanDictionaryAPIDefinition, UrbanDictionaryAPIResult };

export interface UrbanDictionaryRequestOptions extends RequestOptions {
    readonly endpoint: 'random' | 'define' | 'autocomplete-extra';
    readonly params?: ['term', string][];
}

export class UrbanDictionaryAPI extends API<UrbanDictionaryRequestOptions> {

    constructor(options?: APIOptions<UrbanDictionaryRequestOptions>) {
        super(`http://api.urbandictionary.com/v0`, options);
    }

    protected override fetch(request: UrbanDictionaryRequestOptions & { type: 'json', endpoint: 'random'; }): Promise<UrbanDictionaryAPIResult>;
    protected override fetch(request: UrbanDictionaryRequestOptions & { type: 'json', endpoint: 'define'; }): Promise<UrbanDictionaryAPIResult>;
    protected override fetch(request: UrbanDictionaryRequestOptions & { type: 'json', endpoint: 'autocomplete-extra'; }): Promise<UrbanDictionaryAPIResult>;
    protected override fetch(request: UrbanDictionaryRequestOptions): Promise<unknown> {
        return super.fetch(request);
    }

    public async random(): Promise<UrbanDictionaryAPIDefinition[]> {
        const res = await this.fetch({ endpoint: 'random', type: 'json', force: true });
        return res.list ?? [];
    }

    public async define(term: string | null): Promise<UrbanDictionaryAPIDefinition[]> {
        if (!term) return this.random();
        const res = await this.fetch({ endpoint: 'define', type: 'json', params: [['term', term]] });
        return res.list ?? [];
    }

    public async autocomplete(term: string): Promise<UrbanDictionaryAPIAutocomplete[]> {
        const res = await this.fetch({ endpoint: 'autocomplete-extra', type: 'json', params: [['term', term]] });
        return res.results ?? [];
    }
}
