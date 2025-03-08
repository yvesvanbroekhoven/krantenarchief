// ==UserScript==
// @name         krantenarchief
// @namespace    yvb
// @version      1.0.2
// @description
// @author       yvesvanbroekhoven
// @include      https://*.tijd.be/*
// @include      https://*.standaard.be/*
// @include      https://*.gva.be/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    window.MY_PROXY = 'https://roxy.vanbroekhoven.dev'; // Fill in your proxy URL

    addCustomStyles();
    appendButton();
    addEventListeners();
})();

function addCustomStyles() {
    var style = document.createElement('style');

    style.innerHTML = `
[data-id="react-paywall-auth0"] { display: none; }
[data-testid="info-popup"],
[data-testid="paywall-position-popup"] { display: none; }

[class*="style_disable-scroll-popup"] {
  overflow-y: auto !important;
  position: static !important;
  width: auto !important;
}

.krantenarchief {
  background: #ffdb09;
  border: none;
  color: white;
  cursor: pointer;
  font-weight: bold;
  padding: 1rem 2rem;
  position: fixed;
  right: 0;
  rotate: -90deg;
  top: 50vh;
  transform-origin: center;
  translate: 40% 0;
  z-index: 9999;
}
  `;

    document.head.appendChild(style);
};

function appendButton() {
    const buttonTexts = {
        'default': 'bekijk archief',
        'busy': 'bezig met laden'
    }

    const btn = document.createElement('button');
    btn.innerText = buttonTexts.default;
    btn.classList.add('krantenarchief');
    btn.dataset.textBusy = buttonTexts.busy;
    btn.dataset.textDefault = buttonTexts.default;

    document.body.appendChild(btn);
}

function addEventListeners() {
    document.body.addEventListener('click', (event) => {
        if (!event.target.classList.contains('krantenarchief')) return;

        const date = getArticleDate();
        const title = getArticleTitle();

        const formattedDate = new Intl.DateTimeFormat('en-GB').format(date);
        const url = `https://bibliotheek.be/krantenarchief?q=${encodeURIComponent(title)}&facet[date][0]=${formattedDate}..${formattedDate}${getSourceParam()}`;

        event.target.innerText = event.target.dataset.textBusy;

        fetch(window.MY_PROXY + '/' + url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const html = parser.parseFromString(data, 'text/html');

                const link = html.querySelector('.news-archive-item__title a');

                const linkClone = document.createElement('a');
                linkClone.setAttribute('target', '_black');

                if (link) {
                    linkClone.href = link.href.replace(window.location.protocol + '//' + window.location.hostname, 'https://bibliotheek.be');


                } else {
                    linkClone.href = url;

                }

                document.body.appendChild(linkClone);
                linkClone.click();

                event.target.innerText = event.target.dataset.textDefault;
            });
    });
}

function getArticleDate() {
    let dateString = window.digitalData?.page.pageInfo.publishedDate;

    if (!dateString) {
        dateString = window.MEDIAHUIS?.config.article_publicationdatetime_utc;
    }

    if (!dateString) {
        dateString = document.querySelector('[datetime]').getAttribute('datetime');
    }

    return new Date(dateString);
}

function getArticleHead() {
    let articleHead = document.querySelector('.o-mainarticle .o-articlehead');

    if (!articleHead) {
        articleHead = document.querySelector('[data-testid="article-header"]');
    }

    if (!articleHead) {
        articleHead = document.querySelector('[data-testid="article-headline"]');
    }

    return articleHead;
}

function getArticleTitle() {
    let articleTitle = window.digitalData?.page.attributes.navigationTitle;

    if (!articleTitle) {
        articleTitle = window.MEDIAHUIS?.config.article_title;
    }

    if (!articleTitle) {
        articleTitle = window.__NEXT_DATA__.props.pageProps.metaData.title;
    }

    articleTitle = articleTitle.replace(/\?/g, '')

    return articleTitle;
}

function getSourceParam() {
    switch(window.location.hostname) {
        case 'www.standaard.be':
        case 'm.standaard.be':
            return '&facet[sourceid][0]=2';
        case 'www.tijd.be':
            return '&facet[sourceid][0]=3';
        case 'www.gva.be':
        case 'm.gva.be':
            return '&facet[sourceid][0]=4';
    }
}