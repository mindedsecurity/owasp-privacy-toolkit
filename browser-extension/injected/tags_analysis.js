(function () {


    var EXECUTE_PLUGIN = true;
    if (!EXECUTE_PLUGIN)
        return;
    var _Array = Array;
    var arr_indexOf = _Array.prototype.indexOf;
    var globalVar = typeof window !== "undefined" ? window : (typeof global !== 'undefined' ? global : this);
    const eventName = "OPrivacy_Event";
    ///////////////////////
    //// Log FUNCTIONS

    var module_name = "Scripts Analysis";

    function log() {
        console.log.apply(this, [`[${module_name}]`, ...arguments]);
    }

    function dir() {
        console.dir.apply(this, arguments);
    }

    function log_error() {
        console.error.apply(this, [`[${module_name}]`, ...arguments]);
    }

    function debug() {
        console.debug.apply(this, [`[${module_name}]`, ...arguments]);
    }
    /////////////////////////////////////
    ///// Cross Messaging Management ////
    // TODO: CREATE A SINGLE OBJECT FOR MESSAGING
    /**
     * Expected Object: 
     * {
     *  type: msg.type, 
     *  key: msg.key, 
     *  result:msg.result
     * }
     */
    function sendEvent(obj) {
        var cev = new CustomEvent(eventName, {
            detail: obj,
            bubbles: false,
            cancelable: true
        });
        globalVar.dispatchEvent(cev);
    }

    ///////// SCRIPT CONSTANTS
    // See https://www.rfc-editor.org/rfc/rfc9239.html#name-iana-considerations
    var script_mime = ["text/javascript",
        "application/javascript",
        "application/ecmascript",
        "application/x-ecmascript",
        "application/x-javascript",
        "text/ecmascript",
        "text/jscript",
        "text/livescript",
        "text/x-ecmascript",
        "text/javascript1.0",
        "text/javascript1.1",
        "text/javascript1.2",
        "text/javascript1.3",
        "text/javascript1.4",
        "text/javascript1.5",
        "module"
    ];

    /// Observer FUNCTIONS

    // Select the node that will be observed for mutations
    const targetNode = globalVar.document;

    // Options for the observer (which mutations to observe)
    const config = {
        childList: true,
        subtree: true
        // attributes: true, <<<< ??? DO WE NEED IT? MAYBE NOT?
    };

    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
        for (const mutation of mutationList) {
            //debug(mutation)
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    /**
                     * nodeNames with remote access to be checked:
                     * SCRIPT? YES // Referrer Policy + Prototype + ...
                     * Style? // Referrer Policy + CSS Might be used to access DOM content.
                     * Link?  // Referrer Policy + CSS Might be used to access DOM content.
                     * IMG?   // Referrer Policy 
                     * A?     // Referrer Policy 
                     * ...?   // Referrer Policy 
                     */
                    if (node.nodeName === 'SCRIPT') {
                        let node_type = node.type.toLowerCase();
                        if (node_type === "" || arr_indexOf.call(script_mime, node_type) !== -1) {
                            // TODO node.type === "module"? 
                            /**
                             *  TODO:
                             *  check for:
                             * defer // No effect on inline or modules scripts (Modules defer by default) https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#defer
                             * async
                             * type
                             * blocking?
                             * crossorigin? see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin
                             * noModule?
                             * nonce?
                             * integrity?
                             * type? ""|importMap|module|speculationRules|AnyOtherValue(Data block) See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type
                             * referrerPolicy (ON EVERY TAG?) see. https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#referrerpolicy
                             */

                            let obj = {
                                src: node.src,
                                async: node.async,
                                defer: node.defer,
                                type: node_type,
                                // @Marti, Commenting blocking out since is experimental
                                //blocking:  Array.from(node.blocking),
                                crossorigin: node.crossOrigin || node.crossorigin,
                                // @Marti, Do we think integrity presence can concern privacy? 
                                integrity: node.integrity,
                                // @Marti, We don't think nonce presence can concern privacy 
                                //nonce: node.nonce,
                            };
                            debug(`Script Attributes:
                        SRC\t\t${node.src}
                        ASYNC\t\t${node.async} 
                        BLOCKING\t${node.blocking} 
                        DEFER\t\t${node.defer}
                        crossorigin\t${node.crossOrigin || node.crossorigin} 
                        integrity\t\t${node.integrity}
                        noModule\t${node.nomodule}
                        NONCE\t\t${node.nonce}
                        referrerPolicy\t\t${node.referrerPolicy}
                        TYPE\t\t${node.type}
                        `);
                            sendEvent({
                                type: "scripts",
                                result: obj
                            });
                        }
                    }
                }
            }
        }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

})();