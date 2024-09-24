(function () {

    var EXECUTE_PLUGIN = true;
    if (!EXECUTE_PLUGIN)
        return;

    var globalVar = typeof window !== "undefined" ? window : (typeof global !== 'undefined' ? global : this);

    var _String = String;
    var _toString = Object.prototype.toString;
    var _setInterval = globalVar.setInterval;

    const eventName = "OPrivacy_Event";

    var module_name = "OVERSHARING";

    function log() {
        console.log.apply(this, [`[${module_name}]`, ...arguments]);
    }

    function log_error() {
        console.error.apply(this, [`[${module_name}]`, ...arguments]);
    }

    var dataMap = {};
    var parseMap = {};
    var TLOs = [];

    function cleanObject(obj) {
        for (var k in obj) {
            if (typeof obj[k] == "object" && obj[k] !== null)
                cleanObject(obj[k]);
            else
                // do something... 
                obj[k] = false
        }
    }

    var currentPath = []

    function proxyfy(obj, callerName) {

        if (obj == null)
            return null;



        TLOs.push(obj);

        const handler = {
            get(target, key) {

                if (TLOs.indexOf(target) != -1) {
                    currentPath = []
                    //console.log("cleaning", target, key)
                }

                if (key == 'isProxy')
                    return true;

                if (key == '__callerName')
                    return callerName;

                const prop = target[key];
                currentPath.push(key)

                // return if property not found
                if (typeof prop == 'undefined')
                    return;

                // set value as proxy if object
                if (prop && !prop.isProxy && typeof prop === 'object')
                    target[key] = new Proxy(prop, handler);
                else {
                    //Do action 
                    //console.log("MUST RETURN", callerName, currentPath)
                    var mapTarget = dataMap[callerName]
                    for (k of currentPath) {
                        if (mapTarget && typeof mapTarget[k] === 'boolean')
                            mapTarget[k] = true
                        else if (mapTarget)
                            mapTarget = mapTarget[k]
                    }
                    //console.log(target)
                    //target = true
                    currentPath = []
                }

                return target[key];
            },
            set(target, key, value) {
                try{
                    //console.log('Setting', target, `.${key} to equal`, value);
                }catch(e){
                    //pass
                }

                // todo : call callback

                target[key] = value;
                return true;
            }
        };

        //obj.__proto__.__isTLO = true

        const proxy = new Proxy(obj, handler);
        return proxy
    }

    var __JSON_parse = JSON.parse;

    JSON.parse = function (p1) {

        //console.log("OVERLOADED JSON PARSE");

        var parsedData = __JSON_parse.apply(this, arguments)
        var mapEntry = __JSON_parse.apply(this, arguments)

        cleanObject(mapEntry)

        var callerName = "testName" + (Math.random() * 10)

        if(Object.hasOwn(parseMap, p1)){
            callerName = parseMap[p1];
            dataMap[callerName] = mapEntry
            //console.error("Done proxyfication", p1);

            return proxyfy(parsedData, callerName);
        }

        //console.error("SKIPPING", p1);
        return parsedData;
    }

    var __Response_json = Response.prototype.json;

    Response.prototype.json = function () {

        //console.log("OVERLOADED Response Json", this.url);
        var that = this;
        return new Promise((resolutionFunc, rejectionFunc) => {
            __Response_json.apply(that, arguments).then(json => {
                try {
                    const _URL = that.url;
                    var mapEntry = JSON.parse(JSON.stringify(json));
                    cleanObject(mapEntry);
                    dataMap[_URL] = mapEntry;
                    resolutionFunc(proxyfy(json, _URL));
                } catch (exc) {
                    rejectionFunc(exc);
                }
            }).catch(rejectionFunc);
        });

    }

    var __XMLHttpRequest_send = XMLHttpRequest.prototype.send;
    var __XMLHttpRequest_constructor = XMLHttpRequest;

    XMLHttpRequest = function(){

        var xhr = new __XMLHttpRequest_constructor();
        xhr.addEventListener("readystatechange", function() {
            if (this.readyState == 4) {
                if(this.responseType === "text" || this.responseType === ""){
                    parseMap[this.responseText] = this.responseURL;
                }else if(xhr.responseType === "json"){
                    var mapEntry = JSON.parse(JSON.stringify(xhr.response))

                    cleanObject(mapEntry)

                    dataMap[this.responseURL] = mapEntry
                    xhr.response = proxyfy(xhr.response, this.responseURL)
            }


            }

        });

        return xhr;
    }

    Object.assign(XMLHttpRequest, __XMLHttpRequest_constructor);
    

    function printResults() {
        console.log("####################################")
        console.log("###############RESULT###############")
        console.log("####################################")
        console.log(dataMap)
    }

    setInterval(function(){
        var cev = new CustomEvent(eventName, {
            detail: {
                type: "oversharing_results",
                result: JSON.stringify(dataMap)                
            },
            bubbles: false,
            cancelable: true
        });
        globalVar.dispatchEvent(cev);
    }, 1000);     
    

    //log("Initialized!")
})();
