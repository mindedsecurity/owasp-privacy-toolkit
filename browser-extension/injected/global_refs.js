/**
 * Isolated Script for message passing 
 */
(function () {
    var EXECUTE_PLUGIN = true;
    if (!EXECUTE_PLUGIN)
        return;

    var globalVar = typeof window !== "undefined" ? window : (typeof global !== 'undefined' ? global : this);

    var _String = String;
    var _toString = Object.prototype.toString;
    var _setInterval = globalVar.setInterval;
    const eventName = "OPrivacy_Event";

    var module_name = "GLOBAL_REFS";
    function log() {
        console.log.apply(this, [`[${module_name}]`, ...arguments]);
    }
    function debug() {
        console.debug.apply(this, [`[${module_name}]`, ...arguments]);
    }
    function log_error() {
        console.error.apply(this, [`[${module_name}]`, ...arguments]);
    }

    function getMatch(input, regex, innerChecks){
        var matchList = input.match(regex);
        var match = null;

        if(matchList && matchList.length > 0){
            match = matchList[0]

            if(innerChecks.length > 0){
                for(check of innerChecks){
                    var iMatch = match.match(check)
                    if(iMatch)
                        return iMatch[0]
                }
                return null;
            }
        }

        return match;
    }

    const CHECKS_LIST = {
        email: (value) => {
            return getMatch(
                _String(value).toLowerCase(),
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                []
            )
        },
        creditCard: (value) => {
            return getMatch(
                _String(value),
                /(?<!\d)\d{16}(?!\d)|(?<!\d[ _-])(?<!\d)\d{4}(?:[_ -]\d{4}){3}(?![_ -]?\d)/gm,
                [
                    /^3[47][0-9]{13}$/gm, //Amex
                    /^(6541|6556)[0-9]{12}$/gm, //BCGlobal
                    /^389[0-9]{11}$/gm, //Carte Blanche
                    /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/gm, //Diners Club
                    /^65[4-9][0-9]{13}|64[4-9][0-9]{13}|6011[0-9]{12}|(622(?:12[6-9]|1[3-9][0-9]|[2-8][0-9][0-9]|9[01][0-9]|92[0-5])[0-9]{10})$/gm, //Discover
                    /^63[7-9][0-9]{13}$/gm, //Insta Payment
                    /^(?:2131|1800|35\d{3})\d{11}$/gm, //JCB
                    /^9[0-9]{15}$/gm, //KoreanLocalCard
                    /^(6304|6706|6709|6771)[0-9]{12,15}$/gm, //Laser
                    /^(5018|5020|5038|5893|6304|6759|6761|6762|6763)[0-9]{8,15}$/gm, //Maestro
                    /^5[1-5][0-9]{14}$/gm, //Mastercard
                    /^(6334|6767)[0-9]{12}|(6334|6767)[0-9]{14}|(6334|6767)[0-9]{15}$/gm, //Solo
                    /^(4903|4905|4911|4936|6333|6759)[0-9]{12}|(4903|4905|4911|4936|6333|6759)[0-9]{14}|(4903|4905|4911|4936|6333|6759)[0-9]{15}|564182[0-9]{10}|564182[0-9]{12}|564182[0-9]{13}|633110[0-9]{10}|633110[0-9]{12}|633110[0-9]{13}$/gm, //Switch
                    /^(62[0-9]{14,17})$/gm, //Union Pay
                    /^4[0-9]{12}(?:[0-9]{3})?$/gm, //Visa
                    /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})$/gm //Visa Master
                ]
            )
        },
        phoneNumber: (value) => {
            return getMatch(
                _String(value),
                /^\+?(\s)?\d*\s\d{3}(\s|-)?\d{3}(\s|-)?\d*(\s|-)?\d*$/gm,
                []
            )
        }
    };

    if(location.protocol == 'chrome-extension:' && chrome.extension){
        console.log("I'm a bg script!")
        globalVar.exported = globalVar.exported || {};
        globalVar.exported.CHECKS_LIST = CHECKS_LIST
    }else{
        console.log("I'm a content script!")
        
        ///////////////////////////////////////////////////
        ////// Global Objects Analysis

        async function* createWorkLimiter(
            work = 10,
            pause = 6,
        ) {
            let start = Date.now()
            for ( ; ; ) {
            yield
            if (Date.now() >= start + work) {
                await delay(pause)
                start = Date.now()
            }
            }
        }
        
        function delay(ms) {
            return new Promise(resolve =>
            setTimeout(resolve, ms)
            )
        }
        
        async function globalSearchRegex(startObject, valueMatcher) {
            const workLimiter = createWorkLimiter()

            var resultStore = [];

            var stack = [
                [startObject, '']
            ];
            var searched = [];
            var found = false;

            var interval = setInterval(function () {
                debug("search in progress...");
            }, 2500);

            var isArray = function (test) {
                return _toString.call(test) === '[object Array]';
            }

            while (stack.length) {
                var fromStack = stack.pop();
                var obj = fromStack[0];
                var address = fromStack[1];

                if (typeof obj == "string" && (match = valueMatcher(obj))) {
                    var found = address;
                    // debug(address);
                    //debug(fromStack)
                    fromStack.unshift(match)
                    resultStore.push(fromStack);
                    //console.log(address)
                } else if (typeof obj == "object" && searched.indexOf(obj) == -1) {
                    if (isArray(obj)) {
                        var prefix = '[';
                        var postfix = ']';
                    } else {
                        var prefix = '.';
                        var postfix = '';
                    }
                    for (i in obj) {
                        await workLimiter.next()

                        try {

                            if (typeof (ServiceWorkerContainer) !== 'undefined' && i === 'ready' && obj instanceof ServiceWorkerContainer)
                                debug("This ServiceWorkerContainer access will throw an exc.")
                            else if(typeof (CSSStyleSheet) !== 'undefined' && obj instanceof CSSStyleSheet)
                                debug("This CSSStyleSheet access will throw an exc.")
                            else
                                stack.push([obj[i], address + prefix + i + postfix]);

                        } catch (e) {
                            log_error(e)
                        }
                    }
                    searched.push(obj);
                }
            }

            if(interval != null)
                clearInterval(interval);

            return resultStore.length == 0 ? false : resultStore;
        }

        async function execute_Search() {
            debug("Running gadata checks...");
            for (check in CHECKS_LIST) {
                //debug(check)
                var checkType = check.toString();
                var res = await globalSearchRegex(globalVar, CHECKS_LIST[check]);

                if(res){
                    var cev = new CustomEvent(eventName, {
                        detail: {
                            type: "global_refs",
                            key: checkType,
                            result: JSON.stringify(res)                
                        },
                        bubbles: false,
                        cancelable: true
                    });
                    globalVar.dispatchEvent(cev);    
                }
            }

            setTimeout(()=>{
                console.log(window)
            },10000)
        }

        globalVar.addEventListener('DOMContentLoaded', execute_Search);
    }
})();