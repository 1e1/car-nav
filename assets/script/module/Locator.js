import { Defaults } from './../Defaults.js';

const CFG = new Defaults('Locator', {
    //url: 'https://api-adresse.data.gouv.fr/search/?q=${query}&lon=${longitude}&lat=${latitude}&limit=${limit}&autocomplete=${autocomplete}',
    url: 'https://demo.addok.xyz/search/?q=${query}&lon=${longitude}&lat=${latitude}&limit=${limit}&autocomplete=${autocomplete}',
    queryMinLength: 3,
    suggestionLength: 10,
    autocomplete: 1,
    triggerTimeoutMs: 800,
});


class Locator {
    constructor(position, callback) {
        this.tid = null;
        this.position = position;
        this.xhr = new XMLHttpRequest();
        this.xhr.addEventListener('load', (event) => {
            this.tid = null;
            const result = JSON.parse(this.xhr.responseText);

            callback(result);

            // TODO fallback Google `q=adresse+${text}`
            // let div = document.querySelector("[data-async-context^='query:']");
            // while (div.nodeName=="DIV"&&div.firstChild!=null) {
            //   div = div.firstChild;
            // }
            // return div.nodeName=="#text" ? node.nodeValue : null;
            //
            // var n = document.querySelector("[data-async-context^='query:']"); while(n.nodeName=="DIV"&&n.firstChild!=null){console.log(n);n=n.firstChild;}console.log(n.nodeName=="#text"?n.nodeValue:null);
        });
    }

    open(text, limit, autocomplete) {
        //this.xhr.open('GET', `https://api-adresse.data.gouv.fr/search/?q=${encodeURI(text)}&lon=${this.position.longitude}&lat=${this.position.latitude}&limit=${limit}&autocomplete=${autocomplete}`, true);
        const url = CFG._('url', {
            query: encodeURI(text),
            longitude: this.position.longitude, 
            latitude: this.position.latitude, 
            limit: limit,
            autocomplete: autocomplete,
        });

        this.xhr.open('GET', url, true);
    }

    search(text) {
        if (this.tid) {
            window.clearTimeout(this.tid);
        }
        this.xhr.abort();

        if (text.length > CFG._('queryMinLength')) {
            this.open(text, CFG._('suggestionLength'), CFG._('autocomplete'));
            this.tid = window.setTimeout(() => this.xhr.send(), CFG._('triggerTimeoutMs'));
        }
    }

    get(text) {
        this.open(text, 1, 0);
        this.xhr.send();
    }
}

export { Locator };
