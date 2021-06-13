const fetch = require('node-fetch');

class UrbanDictionaryApi {
    static request(endpoint, params = [], options = {}) {
        options = Object.assign({ method: 'GET' }, options);
        params = params.map((param) => `${param[0]}=${encodeURIComponent(param[1])}`).join('&');
        const url = `http://api.urbandictionary.com/v0/${endpoint}?${params}`;
        return fetch(url, options).then(res => res.json());
    }

    static define(term) { return UrbanDictionaryApi.request('define', [['term', term]]); }
    static random() { return UrbanDictionaryApi.request('random'); }
};

module.exports = UrbanDictionaryApi;
