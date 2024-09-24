/**
 *  referrers_by_tab = { 
*   tabid : {
    *   docId : {
    *   
        *  initiator_domain (e.g. www.google.com): {
        *          [collector_url] : [  url where the request is sent as value (research by key presence)
        *   leaked_url, ... full referrer urls from header (full initiator url) as value (research by key presence)
        * ] 
        *    }
    *  }
 * };
 * 
 * 
 */

var referrers_by_tab = {};

function addToReferrerCollector(tabId, domain, leaked_url, collector_url) {
    if (typeof tabId === "undefined") {
        debugger;
    }
    console.log("ADDING ", tabId, domain, leaked_url, collector_url)
    referrers_by_tab[tabId] = referrers_by_tab[tabId] || {}
    referrers_by_tab[tabId][domain] = referrers_by_tab[tabId][domain] || {};
    referrers_by_tab[tabId][domain][collector_url] = referrers_by_tab[tabId][domain][collector_url] || [];
    referrers_by_tab[tabId][domain][collector_url].push(leaked_url);
}

function checkUnique(tabId, domain, leaked_url, collector_url) {

    return referrers_by_tab[tabId] &&
        referrers_by_tab[tabId][domain] &&
        referrers_by_tab[tabId][domain][collector_url] &&
        referrers_by_tab[tabId][domain][collector_url].indexOf(leaked_url) !== -1;
}

/**
 * This function monitors the referrer leakages
 */
chrome.webRequest.onSendHeaders.addListener(
    function (details) {
        var EXECUTE_PLUGIN = true;
        if (!EXECUTE_PLUGIN) {
            return;
        }
        var requested_url = parseUrl(details.url);
        if (details.initiator === 'null')
            return;
        if (details.initiator)
            var initiator_url = parseUrl(details.initiator);
        if (initiator_url && (initiator_url.sld !== requested_url.sld
            && !is_trusted_sld(initiator_url.sld, requested_url.sld))) {

            for (let header of details.requestHeaders) {
                if (header.name === "Referer") {
                    const referrer_url = parseUrl(header.value);

                    // Sometimes, referrer domain is different from initiator domain (i.e. external CSS) 
                    // so we need to double check for referrer as well.
                    if (referrer_url &&
                        (referrer_url.sld === requested_url.sld ||
                            is_trusted_sld(referrer_url.sld, requested_url.sld)))
                        return;

                    var msg_template = {
                        'type': messageTypeName,
                        url: initiator_url,
                        tabId: details.tabId
                    };
                    //console.log(header, requested_url, initiator_url)
                    var data_template = {
                        to_domain: requested_url.domain,
                        to_url: requested_url.url,
                        leak_url: referrer_url.url,
                        type: "referrer"
                    }
                    if (checkUnique(details.tabId, referrer_url.domain, referrer_url.url, requested_url.url))
                        return;
                    else {
                        addToReferrerCollector(details.tabId, referrer_url.domain, referrer_url.url, requested_url.url);
                    }
                    if (referrer_url.query) {
                        //TODO: RISK HIGH Has query String!!!
                        sendMessageCallback({
                            data: {
                                risk: 3,
                                leak_type: "query",
                                ...data_template
                            },
                            ...msg_template
                        })
                    } else if (referrer_url.pathname !== "" && referrer_url.pathname !== "/") {
                        //TODO: Risk Medium: Has Path Name
                        sendMessageCallback({
                            data: {
                                risk: 2,
                                leak_type: "pathname",
                                ...data_template
                            },
                            ...msg_template
                        })
                    } else if (referrer_url.domain) {
                        //TODO: Risk Low Has DOMAIN 
                        sendMessageCallback({
                            data: {
                                risk: 1,
                                leak_type: "domain",
                                ...data_template
                            },
                            ...msg_template
                        })
                    }
                    break;
                }
            }
        }
    }, {
    urls: ["<all_urls>"]
},
    ["requestHeaders",
        "extraHeaders"
    ]
);