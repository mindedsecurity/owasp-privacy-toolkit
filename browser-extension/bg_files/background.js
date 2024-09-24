/**
 * OWASP Privacy Toolkit
 * Background file 
 * @authors:
 * @copyright: 
 * 
 */
const messageTypeName = 'OPrivacy_Message';


importScripts("./bg_utils.js");
importScripts("./bg_sld.js");
importScripts('./bg_script_load_monitor.js');
importScripts('./bg_referrer_monitor.js');
importScripts('./bg_prototype.js');


// Global per-url results store
var resultsStore = {
}

function pushResults(tabId, index, data){
  if(resultsStore[tabId] === undefined){
    // Single application results storage model
    resultsStore[tabId] = {
          /*
           * {
           *   leak_type: domain|pathname|query
           *   leak_url: leaked_url
           *   risk: 3-1
           *   to_url: where it's going to leak
           * }
           */
      referrer: [],
          /*
           * {  
           *      API_URL: {
           *          response_field1: bool indicating if the field was accessed
           *          response_field2: bool indicating if the field was accessed 
           *          response_field3: bool indicating if the field was accessed
           *          ...
           *      },
           *      ...
           *   }
           */
      oversharing: {},
          /**
           * {
           *   key: triggering rule identifier (e.g. email, creditcard, etc.),
           *   result: Array of results, each item is an array as well containing: [Rule full match, Captured group, DOM node selector]
           * }
           * 
           */
      globalRefs:[],
          /**
           * {
           *   initiatorHostname: hostname loading the resource,
           *   requestedUrl: loaded resource url
           *   triggeredScriptUrl: 1st party url generating the issue
           *   requestedScripts: requested_scripts_by_tab
           * }
           */

      scriptLoading:[]
    }
  }


  if(Object.prototype.toString.call(resultsStore[tabId][index]) === '[object Array]'){
    // if array -> pushing a new element
    resultsStore[tabId][index].push(data);
  }else if (Object.prototype.toString.call(resultsStore[tabId][index]) === '[object Object]'){
    // if object -> merging the existing element
    resultsStore[tabId][index] = {...resultsStore[tabId][index], ...data};
  }

}

function fetchResults(){
  return resultsStore;
}

function resetResults() {
  resultsStore = {};
  referrers_by_tab = {};
  requested_scripts_by_tab = {};
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {

    // do your things

  }
});

async function sendMessageCallback(message, sender, sendResponse) {
  if (message.type === messageTypeName) {
    /**
     *{
        "type": "OPrivacy_Message",
        "url": initiator_url,
        "data": {
          type: referrer|prototype|scripts|global_refs|oversharing
          ....
        }
      };
     */
    let {
      type,
      data,
      url
    } = message;
    if (data) {
      var res = null;

      switch (data.type) {
        case "referrer":
          /**
           * Expecting sub object: 
           * {
           *   type: "referrer",
           *   leak_type: domain|pathname|query
           *   leak_url: leaked_url
           *   risk: 3-1
           *   to_url: where it's going to leak
           * }
           * 
           */
          let {
            leak_type, leak_url, risk, to_url
          } = data;
          console.log("%c Exposes %s %s to %s",
            `color: ${risk === 3 ? "red" : (risk === 2 ? "orange" : "#5F9EA0")}; font-size: 2em;`, leak_type, leak_url, to_url)

          pushResults(message.tabId, "referrer", data);

          break;
        case "prototype":
          // TODO: Deal with the data
          res = data.result;
          set_proto_data({
            tabId: sender.tab.id,
            documentId: sender.documentId,
            res: res
            //...res
          });
          break;
        case "scripts":
          /**
           * Expecting sub object: 
           * {
           *   type: "scripts",
           *   src: url
           *   async: bool
           *   defer: bool
           *   type: ""|importMap|module|speculationRules|AnyOtherValue(Data block)
           *   crossorigin: bool
           *   integrity: bool
           * }
           * 
           */
        var script_data = data.result;

          res = scriptAnalyzer({
            url: script_data.src,
            initiator: url,
            tabId: sender.tab.id,
            documentId: sender.documentId,
            frameId: sender.frameId,
            isAsync: script_data.async,
            isDefer: script_data.defer || script_data.type === "module"
          });

          if(res){
            pushResults(sender.tab.id, "scriptLoading", res);
          }

          break;
        case "global_refs":

        let {
          key, result
        } = data;
          /**
           * Expecting sub object: 
           * {
           *   type: "global_refs",
           *   key: triggering rule identifier (e.g. email, creditcard, etc.),
           *   result: Array of results, each item is an array as well containing: [Rule full match, Captured group, DOM node selector]
           * }
           * 
           */

          pushResults(sender.tab.id, "globalRefs", data);


          break;
        case "oversharing_results":
         /**
           * Expecting sub object: 
           * {
           *   type: "oversharing_results",
           *   result: {  //Object map of the analyzed APIs,
           *      API_URL: {
           *          response_field1: bool indicating if the field was accessed
           *          response_field2: bool indicating if the field was accessed 
           *          response_field3: bool indicating if the field was accessed
           *          ...
           *      },
           *      ...
           *   }
           * }
           * 
           */

          var d = JSON.parse(data.result);

          pushResults(sender.tab.id, "oversharing", d);

          break;
        default:
          console.error("Unexpected Message: ", message);

      }
    }
  }else if(message.type === 'getToolkitResults'){
    // Message from the popup.js, asking for current results to be displayed
    // Results are filered and only the active tab's set is returned
    var query = { active: true, currentWindow: true };
    var tabs = await chrome.tabs.query(query);
    var currentTab = tabs[0];
      
    sendResponse({data: resultsStore[currentTab.id]})

  }
}
////////////////////////////////////////////
///// Message Management
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  sendMessageCallback(message,sender,sendResponse);

  // Important! Return true to indicate you want to send a response asynchronously
  return true;
});



/**
 * We want to keep the script collector as clean as possible,
 * so we remove the tab data when the tab is closed.
 */
chrome.tabs.onRemoved.addListener(
  function (tabId) {
    removeFromScriptCollector(tabId);

    // ResultStore cleanup
    delete resultsStore[tabId];
    // Add other functions to keep all in order
  }
)


//////////////////////////////////////////
//// Dynamic Script content injections (Commented out)
// chrome.webNavigation.onDOMContentLoaded.addListener(async ({ tabId, frameId }) => {
//   if(frameId == 0){
//     const { options } = await chrome.storage.local.get('options');
//     chrome.scripting.executeScript({
//       target: { tabId },
//       files: ['gadata.js'],
//       ...options
//     })
//     .then(injectionResults => {
//       console.log("Got res");
//       for (const {frameId, result} of injectionResults) {
//         console.log(`Frame ${frameId} result:`, result);
//       }
//     });
//   }
// });

console.log("Completed background")