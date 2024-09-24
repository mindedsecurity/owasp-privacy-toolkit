/////////////////////////////////////////////////////////
///////// Checks for first party scripts as first loaded

// TODO update the array on tab changes (close, load new site etc)
// Structure: external_on_bottom_array[tabId][documentId]
/**
 *  {
 *   tabbid : {
 *    docId : {
 *  hostname (e.g. www.google.com): [ 
 *  {
 *   is_same_sld: true|false
 *  requested_url: requested_url (full url)
 * }
 * ] 
 *  }
 *  }
 */
var requested_scripts_by_tab = {};

/**
 * Appends script sequence to 
 * requested_scripts_by_tab[tabId][documentId][initiator_url.hostname] array
 */
function addToScriptCollector(tabId, documentId, initiator_url, requested_url, isDefer) {
  var table = requested_scripts_by_tab;
  var scriptType = isDefer ? "defer" : "synch";
  table[tabId] = table[tabId] || {};
  table[tabId][documentId] = table[tabId][documentId] || {};
  table[tabId][documentId][initiator_url.hostname] = table[tabId][documentId][initiator_url.hostname] || {};
  table[tabId][documentId][initiator_url.hostname][scriptType] = table[tabId][documentId][initiator_url.hostname][scriptType] || [];

  table[tabId][documentId][initiator_url.hostname][scriptType].push({
    is_same_sld: initiator_url.sld === requested_url.sld ||
      is_trusted_sld(initiator_url.sld, requested_url.sld),
    requested_url: requested_url.url
  });
}

/**
 * This function will return true if a first party (or trusted party) script is loaded after a 3rd party script
 */
function shouldTriggerScriptSequence(tabId, documentId, initiator_url, requested_url, isDefer) {
  try {
    var scriptType = isDefer ? "defer" : "synch";
    var docStatus = requested_scripts_by_tab[tabId][documentId][initiator_url.hostname][scriptType];
    if (docStatus.length > 1) {
      // Expecting false + true
      var res = !docStatus[docStatus.length - 2].is_same_sld && docStatus[docStatus.length - 1].is_same_sld;


      return res;
    } else
      return false;
  } catch (exc) {
    console.error(exc);
  }
}

/**
 * Helper function to remove an entire tab data from requested_scripts_by_tab
 * used by chrome.tabs.onRemoved
 * Hopefully to be used by other listeners to keep the object as clean as possible
 */
function removeFromScriptCollector(tabId) {
  delete requested_scripts_by_tab[tabId];
}

// chrome.runtime.onMessage.addListener(
//   function (message, sender, sendResponse) {
//     if (message.type === 'BCPrivacyTagMessage') {
//       if (message.data != false)
//         console.log(message.url, message.data)
//     }
//   }
// );

function scriptAnalyzer(details) {
  // If url is empty, it means its' a inline script.
  if (details.url == '')
    details.url = details.initiator + "#INLINE_SCRIPT";

  var requested_url = parseUrl(details.url);
  var initiator_url = parseUrl(details.initiator);
  var tabId = details.tabId;
  var documentId = details.documentId;

  addToScriptCollector(tabId, documentId, initiator_url, requested_url, details.isDefer);
  ////////////////////////////////////////////////////////////////////////////////////////////////
  // We check if requests sequence
  if (shouldTriggerScriptSequence(tabId, documentId, initiator_url, requested_url, details.isDefer)) {

    // TODO Send alert to privacy collector
    // NOPE! This won't work as the messagin is async and we will not be able to control when the event is sent.
    // chrome.tabs.sendMessage(
    //   tabId,
    //   "3rd",
    //   { documentId: documentId, frameId: details.frameId }
    // );
    setHasThirdPartyScript(tabId, documentId);

    var scriptType = details.isDefer ? "defer" : "synch";
    var docStatus = requested_scripts_by_tab[tabId][documentId][initiator_url.hostname][scriptType];

    var triggeredScriptUrl = docStatus[docStatus.length - 2].requested_url;

    console.log("%c WARNING!", "color: red", "Best Practice says 3rd party scripts should be loaded after 1st party scripts.", initiator_url.hostname, requested_url.url, triggeredScriptUrl, requested_scripts_by_tab[tabId][documentId][initiator_url.hostname]);

    return {
      initiatorHostname: initiator_url.hostname, 
      requestedUrl: requested_url.url, 
      triggeredScriptUrl: triggeredScriptUrl, 
      requestedScripts: requested_scripts_by_tab[tabId][documentId][initiator_url.hostname]
    }
  }
  return null;
}
function setHasThirdPartyScript(tabId, documentId) {
  requested_scripts_by_tab[tabId][documentId].hasThird = true;
}
function getHasThirdPartyScript(tabId, documentId) {
  return !!(requested_scripts_by_tab[tabId][documentId].hasThird);
}
chrome.webNavigation.onTabReplaced.addListener(
  function (details) {
    console.log("REPLACE!", details);
  }
)