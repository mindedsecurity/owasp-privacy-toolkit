/**
 * Isolated Script for message passing 
 */

var globalVar = typeof window !== "undefined" ? window : (typeof global !== 'undefined' ? global : this);
const sendRuntimeMessage = chrome.runtime.sendMessage;
const eventName = "OPrivacy_Event";
const eventName_fromExt = "OPrivacy_fromExt";
const messageTypeName = "OPrivacy_Message";
///////////////////////////////////////////////////
/// Message/Events Management
// function trigger3rd() {
//     var cev = new CustomEvent(eventName_fromExt, {
//         detail: {
//             type: "3rd"
//         },
//         bubbles: false,
//         cancelable: true
//     });
//     globalVar.dispatchEvent(cev);
// }

// chrome.runtime.onMessage.addListener(function (msg) {
//     if (msg === "3rd") {
//         console.log(arguments);
//         trigger3rd();
//     }
// });
async function postResults(result) {
    //  console.debug("Executed", result);
    if (false) {
        console.log("POSTRes:", location.href,
            result);
    } else {
        sendRuntimeMessage({
            'type': messageTypeName,
            url: location.href,
            data: result
        });
    }

}

function internalEvent(event) {
    var msg = event.detail;
    postResults({
        type: msg.type,
        key: msg.key,
        result: msg.result
    });
}
globalVar.addEventListener(eventName, internalEvent);

