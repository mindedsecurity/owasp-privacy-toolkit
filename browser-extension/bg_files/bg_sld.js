/////////////////////////////////////////////////////////
///////// Checks for first party scripts as first loaded
/**
 * trusted_sld_by_site = { 
 *    "initiator_domain": [list of external but trusted domains for the initiator]
 */
var trusted_sld_by_site = {
    "google": ["gstatic", "googleusercontent"],
    "facebook": ["fbcdn"],
    "linkedin": ["licdn"],
    "amazon": ["awsstatic"],
    "-": ["googleadservices"], // do not log when initiator sld is in this list.
    "*": [] // do not log any initiator requesting 3rd part slds in list
};

/**
 * FUTURE USE:
 */
var trusted_domains = [];


/**FUTURE USE:
 * Array to be used in the future for website we do not want to analyze.
 */
var dontcheck = [];

function isNumericAddress(ip) {
    const ipv4Pattern =
        /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern =
        /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * Looks for trusted "3rd" parties sites.
 */
function is_trusted_sld(sld1, sld2) {
    var rules = trusted_sld_by_site[sld1];

    if (trusted_sld_by_site['-'].indexOf(sld1) !== -1) {
        return true;
    }

    if (rules)
        return rules.indexOf(sld2) !== -1;
    else
        return trusted_sld_by_site['*'].indexOf(sld2) !== -1;
}
