// ==UserScript==
// @name         krantenarchief
// @namespace    yvb
// @version      1.0.0
// @description
// @author       yvesvanbroekhoven
// @include      https://*.tijd.be/*
// @include      https://*.standaard.be/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    addCustomStyles();
    appendButtonsTijd();
    addEventListeners();
})();

function addCustomStyles() {
    var style = document.createElement('style');

    style.innerHTML = `
[data-id="react-paywall-auth0"] { display: none; }
.o-mainarticle .o-articlehead { position: relative; }
.o-mainarticle .o-articlehead .bib-archive { position: absolute; top: 0; right: 0; }

[data-testid="info-popup"] { display: none; }
  `;

    document.head.appendChild(style);
};

function appendButtonsTijd() {
    let articleHead = getArticleHead();

    const buttonTexts = {
        'default': 'bekijk archief',
        'busy': 'bezig met laden'
    }

    const btn = document.createElement('button');
    btn.innerText = buttonTexts.default;
    btn.classList.add('bib-archive');
    btn.dataset.textBusy = buttonTexts.busy;
    btn.dataset.textDefault = buttonTexts.default;

    articleHead.appendChild(btn);
}

function addEventListeners() {
    document.body.addEventListener('click', (event) => {
        if (!event.target.classList.contains('bib-archive')) return;

        const date = getArticleDate();
        const title = getArticleTitle();

        const formattedDate = new Intl.DateTimeFormat('en-GB').format(date);

        const proxy = ''; // Fill in your proxy domain
        const url = `https://antwerpen.bibliotheek.be/krantenarchief?q=${title}&facet[date][0]=${formattedDate}..${formattedDate}${getSourceParam()}`;

        const link = document.createElement('a');
        link.href = url;
        event.target.parent.prepend(link);

        event.target.innerText = event.target.dataset.textBusy;

        fetch(proxy + url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const html = parser.parseFromString(data, 'text/html');

                const link = html.querySelector('.news-archive-item__title a');

                if (link) {
                    window.open(link.href.replace(window.location.protocol + '//' + window.location.hostname, 'https://antwerpen.bibliotheek.be'));

                } else {
                    window.open(url);

                }

                event.target.innerText = event.target.textDefault;
            });
    });
}

function getArticleDate() {
    let dateString = window.digitalData?.page.pageInfo.publishedDate;

    if (!dateString) {
        dateString = window.MEDIAHUIS?.config.article_publicationdatetime_utc;
    }

    return new Date(dateString);
}

function getArticleHead() {
    let articleHead = document.querySelector('.o-mainarticle .o-articlehead');

    if (!articleHead) {
        articleHead = document.querySelector('[data-testid="article-header"]')
    }

    return articleHead;
}

function getArticleTitle() {
    let articleTitle = window.digitalData?.page.attributes.navigationTitle;

    if (!articleTitle) {
        articleTitle = window.MEDIAHUIS.config.article_title;
    }

    return articleTitle;
}

function getSourceParam() {
    switch(window.location.hostname) {
        case 'www.tijd.be':
            return '&facet[sourceid][3]=3';
        case 'www.standaard.be':
            return '&facet[sourceid][2]=2';
    }
}