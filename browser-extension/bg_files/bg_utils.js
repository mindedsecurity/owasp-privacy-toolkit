// Exports psl = {parse, errorCodes, isValid, get}
// See https://github.com/lupomontero/psl
importScripts('./bg_public_tlds.js');

////////////////////////////////////
/// helper Functions

const pvt_ip_reg = /(^127\.)|(^192\.168\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^::1$)|(^[fF][cCdD])/;
const ip_reg = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/

/**
 * returns only the second level domain name (no trailing tlds etc)
 */
function getSLD(hostname) {
    return psl.parse(hostname).sld;
}

/**
 * returns the whole second level domain name (with trailing TLDs)
 */
function getDomain(hostname) {
    return psl.parse(hostname).domain;
}

/**
 * parses and return a url object from a string.
 */
function parseUrl(url) {
    try {
        var parsed;
        const p = new URL(url);
        var url_obj = {
            hostname: p.hostname,
            port: p.port || (p.protocol === 'http' ? 80 : (p.protocol === 'https' ? 443 : p.protocol)),
            pathname: p.pathname,
            query: p.search,
            // Maybe these won't be useful
            origin: p.origin,
            protocol: p.protocol,
            url: url
        };
        if (isNumericAddress(p.hostname)) {
            return {
                domain: p.hostname,
                sld: p.hostname,
                ...url_obj
            };
        } else {
            parsed = psl.parse(p.hostname);
            return {
                domain: parsed.domain,
                sld: parsed.sld,
                ...url_obj
            };
        } 
    } catch (exc) {
        console.error(exc, url);
    }
}

/**
 * check if the host is an IP
 */
function is_ip(host) {
    return ip_reg.test(host);
}

/**
 * check if the host is a private (IANA) IP
 */
function is_private_ip(ip) {
    return pvt_ip_reg.test(ip);
}

function matchDomain(host1, host2) {
    return getDomain(host1) === getDomain(host2);
}

function matchSLD(host1, host2) {
    return getSLD(host1) === getSLD(host2);
}