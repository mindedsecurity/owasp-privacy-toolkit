/**
 * Script for protoype wrapping and analysis
 */
(function () {
    var EXECUTE_PLUGIN = false;
    if (!EXECUTE_PLUGIN)
        return;

    var globalVar = typeof window !== "undefined" ? window : (typeof global !== 'undefined' ? global : this);

    const eventName = "OPrivacy_Event";
    const eventName_fromExt = "OPrivacy_fromExt";
    // // This might be the a way to minimize overload
    // var has_third_party = false;

    /// SAVE What we need!
    const _Array = Array;
    const _String = String;
    const _Object = Object;
    const obj_prototype = _Object.prototype;
    const arr_prototype = _Array.prototype;
    const str_prototype = _String.prototype;

    const toArray = _Array.from; // Saving the getter
    const slice = arr_prototype.slice; // Saving the getter

    const hasOwnProperty = obj_prototype.hasOwnProperty
    const keys = Object.keys
    const getPrototypeOf = _Object.getPrototypeOf;
    const defineProperty = _Object.defineProperty;
    const getOwnPropertyDescriptor = _Object.getOwnPropertyDescriptor;

    /////////////////////////////////////////////////////////////////////////////////////////////
    /**
     *       [url]: {
     *        [row:cols]:{ 
     *           get:  true|false,
     *           set:  true|false,
     *           call: true|false
     *        }
     */
    var proto_infos = {};
    //var sent_proto_infos = {};
    /**
     * {
     *  [url:rows:cols] : true|false
     * }
     */
    var alert_proto_infos = {}
    function set_proto_data(obj) {
        var res = obj;
        var ref = res.url;
        var row_cols = `${res.row}:${res.col}`;

        // If we already sent the info we won't go any further
        if (hasOwnProperty.call(proto_infos, ref) &&
            hasOwnProperty.call(proto_infos[ref], row_cols) &&
            hasOwnProperty.call(proto_infos[ref][row_cols], res.type)
        )
            return;
        // else we add it to the sent object now..
        //sent_proto_infos[ref] = sent_proto_infos[ref] || {};
        //sent_proto_infos[ref][row_cols] = sent_proto_infos[ref][row_cols] || {};

        // .. and to the object to be sent as well
        proto_infos[ref] = proto_infos[ref] || {};
        var ref_obj = proto_infos[ref][row_cols] = proto_infos[ref][row_cols] || {};


        switch (res.type) {
            case "get": // Are we saving data or are we just accessing the function?
                ref_obj['get'] = true;
                break;
            case "call":
                ref_obj['call'] = true;
                // if GETTER AND CALLER are on the same spot, then it's a problem!
                if (ref_obj['get']) {
                    alert_proto_infos[`${ref}:${row_cols}`] = true;
                    console.log('%c ERROR!!!! ', 'color:red', `CALL ON SAME SPOT!!! URL: ${ref}:${row_cols} ${res.time}`);
                    //delete ref_obj['get'];
                } else {
                    // we need now to check if the GETTER is from a 3rd party script.
                    // DO WE NEED TO USE TIME?
                    // LIKE: it's been calling now, what's the previous getter?
                    //console.log("%c THAT's OK ", "color:blue", `CALL ON!!! URL: ${ref} ${row_cols} ${res.time}`);
                    ref_obj['call'] = true;
                }
                break;
            case "set":
                console.log(` YOOO SET !!!  PROTOTYPE! ${res.time} ${res.function_name} ${res.type}, ${res.url}, ${res.row},${res.col}`, res.debug_full);
                ref_obj['set'] = true;
                break;
        }

    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////
    ///// Cross Messaging Management ////
    /**
     * We get this custome Event if a 3rd party script is called, this should trigger then the batch sending.
     */
    // var has3rdscript = false;
    // globalVar.addEventListener(eventName_fromExt, function (ev) {
    //     has3rdscript = true;
    // });

    async function sendEvent(obj) {
        globalVar.dispatchEvent(new CustomEvent(eventName, {
            detail: obj,
            bubbles: false,
            cancelable: true
        }));
    }

    var module_name = "Prototypes";

    function log() {
        //if (arguments.length === 1)
        console.log.apply(this, [`[${module_name}]`, ...arguments]);
        //else
        //    console.log.apply(this, [`[${module_name}] ${arguments[0]}`, ...slice.call(toArray(arguments), 1)]);
    }

    function trace() {
        console.trace.apply(this, [`[${module_name}]`, ...arguments]);
    }

    function log_error() {
        console.error.apply(this, [`[${module_name}]`, ...arguments]);
    }

    //////////////////////////////////////////////////////////////////
    /////////////////// Stack Parser /////////////////////////////////

    const chromeRe = /^\s*at\s*(.*?)\s*?\(?((?:file|https?|blob|chrome-extension|native|eval|webpack|\/|[a-z]:\\|\\\\).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
    const chromeEvalRe = /\((\S*)(?::(\d+))(?::(\d+))\)/;

    async function parseChrome(line) {
        const parts = chromeRe.exec(line);

        if (!parts) {
            return null;
        }

        const isNative = parts[2] && parts[2].indexOf('native') === 0; // start of line
        const isEval = parts[2] && parts[2].indexOf('eval') === 0; // start of line

        const submatch = chromeEvalRe.exec(parts[2]);
        if (isEval && submatch != null) {
            // throw out eval line/column and use top-most line/column number
            parts[2] = submatch[1]; // url
            parts[3] = submatch[2]; // line
            parts[4] = submatch[3]; // column
        }

        return {
            url: !isNative ? parts[2] : null,
            func_name: parts[1] || '',

            row: parts[3] ? +parts[3] : null,
            col: parts[4] ? +parts[4] : null
            //arguments: isNative ? [parts[2]] : [],
            //lineNumber: parts[3] ? +parts[3] : null,
            //column: parts[4] ? +parts[4] : null,
        };
    }

    async function getCaller() {
        var line_pos = 4;
        var stack = (new Error()).stack;
        var line = stack.split('\n');

        try {
            while (line_pos < line.length) {
                if (line[line_pos].indexOf("chrome-extension://") !== -1 || line[line_pos].indexOf('(<anonymous>)') !== -1) {
                    //log_error("Should FIX THIS");
                    //return null;
                    line_pos++;
                    continue;
                } else {
                    break;
                }
            }
            if (line_pos === line.length) {
                debugger;
                log_error("Should FIX THIS");
                return null;
            }
            line = line[line_pos];

            return { debug_full: stack, ...(await parseChrome(line)) };

        } catch (exc) {
            debugger;
            log_error("ERRR", line)
        }
    }
    /**
     *  async collect_proto_access(fun_name, type)
     * {
     *   fun_name: {
     *     type: "call|getter|setter"
     *     source: "url",
     *     row: row_n,
     *     col: col_n,
     *     time: time_in_millisec
     * }
     * }
     * {
     * url: {
     *    func_name :[ {
     *       type : "call"
     *       row..
     *      col..
     *      time...
     *      }
     * ]
     * }
     * }
     */
    async function collect_proto_access(fun_name, type) {
        // if (!has3rdscript)
        //     return;

        var t = (new Date()).getTime();
        var caller_data = await getCaller();
        if (caller_data === null)
            return;
        const obj = {
            url: caller_data.url,
            function_name: fun_name,
            col: caller_data.col,
            row: caller_data.row,
            stack: caller_data.stack,
            debug_full: caller_data.debug_full,
            type: type,
            time: t
        };
        set_proto_data(obj)
        //sendEvent({ type: "prototype", result: obj })
    }

    globalVar.setInterval(() => {
        if (keys(alert_proto_infos).length !== 0) {
            var obj = alert_proto_infos;
            alert_proto_infos = {}
            sendEvent({ type: "prototype", result: obj });
        }
    }, 1000);
    ///////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////END  STACK PARSING ///////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////
    //// 
    function setToStringNative(func, fname) {
        if (func) {
            func.toString = function toString() {
                if (this !== func) {
                    return this.toString();
                }
                return "function " + (func.name || fname) + "() { [native code] }"
            };
        }
    }



    /**
     * Creates a wrapper around the function, it will send a message with info on where it was called
     */
    function wrapMe(func, func_name) {
        return (function (r) {
            "use strict";
            // Trick to dynamically give a name a function 
            const fname = func.name || func_name;
            const tmp = {
                [fname]: function () {
                    //console.log(`${fname} CALLED!!!!`);
                    collect_proto_access(fname, "call");
                    return r.apply(this, arguments);
                }
            };
            setToStringNative(tmp[fname], fname);
            return tmp[fname];
        })(func);
    }

    function setProtoFunction(proto, el) {
        if (el) {
            // We use Symbol to access the saved function directly in the object as a property.
            const fname = Symbol.for(`_${el.name}`);//_toString etc
            if (el === proto[el.name]) {
                proto[fname] = wrapMe(el, el.name);
                //obj_proto_weakmap.get(proto)[fname] = proto[el.name];
                defineProperty(proto, el.name, {
                    get() {
                        //log('<<<<<<<<<<<<<<<<GETTER Object.prototype.', el.name);
                        collect_proto_access(el.name, "get")
                        if (this[fname])
                            return this[fname];
                        if (this.prototype && this.prototype[fname])
                            return this.prototype[fname];
                        if (this.constructor && this.constructor.prototype && this.constructor.prototype[fname])
                            return this.constructor.prototype[fname];
                        return proto[fname];
                    },
                    set(new_val) {
                        //console.log('%c >>>>>>>>>>>>>>>SETTER Object.prototype.', "color:red", el.name, (new Error()).stack);
                        if (false)
                            collect_proto_access(el.name, "set")
                        this[fname] = wrapMe(new_val, el.name);
                    }
                });

            }
        }
    }
    function setObjectFunction(obj, el, map) {
        if (el) {
            const fname = `_${el.name}`;
            map[fname] = wrapMe(obj[el.name], el.name);
            defineProperty(obj, el.name, {
                get() {
                    //log('<<<<<<<<<<<<<<<<GETTER Object.', el.name);
                    (el.name, "get");
                    return map[fname];
                },
                set(new_val) {
                    //console.log('%c >>>>>>>>>>>>>>>SETTER Object.', "color:red", el.name, (new Error()).stack);
                    map[fname] = new_val;
                    return new_val;
                }
            });
            setToStringNative(el, el.name);
        }
    }


    function wrapObjectMethods() {
        /// PROTOTYPE METHODS
        var object_proto_privacy_sinks = [
            obj_prototype.hasOwnProperty,
            obj_prototype.isPrototypeOf,
            obj_prototype.propertyIsEnumerable,
            obj_prototype.toLocaleString,
            obj_prototype.toString,
            obj_prototype.valueOf
        ];
        ////////////////////////////////////////////////////
        // Temporary booleans for testing the best strategy.
        const use_symbols = true;
        const use_weakmap = false;
        // TODO: test which one has better performances
        /////////////////////////////
        //// TEST Symbol
        if (use_symbols) {
            for (let el of object_proto_privacy_sinks) {
                setProtoFunction(obj_prototype, el);
            }
        } else if (use_weakmap) {
            const obj_proto_weakmap = new WeakMap();
            obj_proto_weakmap.set(obj_prototype, {});

            for (let el of object_proto_privacy_sinks) {
                if (el) {
                    const fname = `_${el.name}`;//_toString etc
                    if (el === obj_prototype[el.name]) {
                        obj_proto_weakmap.get(obj_prototype)[fname] = obj_prototype[el.name];
                        defineProperty(obj_prototype, el.name, {
                            get() {
                                log('<<<<<<<<<<<<<<<<GETTER Object.prototype.', el.name);
                                if (this && this.constructor) {
                                    log("THIS: Constr, proto", this.constructor, this.constructor.prototype)
                                }
                                if (this && this.prototype) {
                                    log("THIS: proto ", this.constructor.prototype)
                                }

                                // THIS
                                if (obj_proto_weakmap.get(this) && obj_proto_weakmap.get(this)[fname]) {
                                    log("RETURN this")
                                    return obj_proto_weakmap.get(this)[fname];
                                }

                                // CONSTR.PROTO
                                if (this.constructor && obj_proto_weakmap.get(this.constructor.prototype) && obj_proto_weakmap.get(this.constructor.prototype)[fname]) {
                                    log("RETURN constructor")
                                    return obj_proto_weakmap.get(this.constructor.prototype)[fname];
                                }

                                // PROTO
                                if (getPrototypeOf(this) && obj_proto_weakmap.get(getPrototypeOf(this)) && obj_proto_weakmap.get(getPrototypeOf(this))[fname]) {
                                    log("RETURN proto")
                                    return obj_proto_weakmap.get(getPrototypeOf(this))[fname];
                                }
                                // OBJECT.PROTOTYPE
                                log("RETURN OBJECT.PROTOTYPE")

                                return obj_proto_weakmap.get(obj_prototype)[fname];
                            },
                            set(new_val) {
                                console.log('%c >>>>>>>>>>>>>>>SETTER Object.prototype.', "color:red", el.name, (new Error()).stack);
                                if (el.name === 'hasOwnProperty') debugger;
                                if (!obj_proto_weakmap.get(this)) {
                                    obj_proto_weakmap.set(this, {});
                                }
                                obj_proto_weakmap.get(this)[fname] = new_val;
                                return new_val;
                            }
                        });
                    }
                    //setToStringNative(el, el.name);
                }
            };
        }
        return;
        /// NON PROTOTYPE METHODS
        var object_privacy_sinks = [
            _Object.assign,
            _Object.create, //??
            _Object.entries,
            _Object.fromEntries,
            _Object.hasOwn,
            _Object.getOwnPropertyDescriptor,
            _Object.getOwnPropertyDescriptors,
            _Object.getOwnPropertyNames,
            _Object.getOwnPropertySymbols,
            _Object.fromEntries,
            _Object.getPrototypeOf,
            _Object.groupBy,
            _Object.hasOwn,
            _Object.is,
            _Object.isExtensible,
            _Object.isFrozen,
            _Object.isSealed,
            _Object.keys,
            _Object.preventExtensions,
            _Object.seal,
            _Object.setPrototypeOf,
            _Object.values
        ];
        var obj_map = _Object.create(null);
        for (let el of object_privacy_sinks) {
            setObjectFunction(_Object, el, obj_map);
        }
    }
    // TODO 
    function wrapArrayMethods() {
        var array_privacy_sinks = [
            arr_prototype.join,
            arr_prototype.at,
            arr_prototype.concat,
            arr_prototype.copyWithin,
            arr_prototype.entries,
            arr_prototype.every,
            arr_prototype.fill,
            arr_prototype.filter,
            arr_prototype.find,
            arr_prototype.findIndex,
            arr_prototype.findLast,
            arr_prototype.findLastIndex,
            arr_prototype.flat,
            arr_prototype.flatMap,
            arr_prototype.forEach,
            arr_prototype.includes,
            arr_prototype.indexOf,
            arr_prototype.keys,
            arr_prototype.lastIndexOf,
            arr_prototype.map,
            arr_prototype.pop,
            arr_prototype.push,
            arr_prototype.reduce,
            arr_prototype.reduceRight,
            arr_prototype.reverse,
            arr_prototype.shift,
            arr_prototype.slice,
            arr_prototype.some,
            arr_prototype.sort,
            arr_prototype.splice,
            arr_prototype.toLocaleString,
            arr_prototype.toReversed,
            arr_prototype.toSorted,
            arr_prototype.toSpliced,
            arr_prototype.toString,
            arr_prototype.unshift,
            arr_prototype.values,
            arr_prototype.with
        ];
        for (let el of array_privacy_sinks) {
            setProtoFunction(arr_prototype, el)
        }
        return;

        var arr_privacy_sinks = [
            _Array.from,
            _Array.fromAsync,
            _Array.isArray,
            _Array.of
        ];
        var obj_map = _Object.create(null);
        for (let el of arr_privacy_sinks) {
            setObjectFunction(_Array, el, obj_map);
        }
    }

    // TODO 
    function globalFunctions() {
        var globFuncs = {
            decodeURI,
            decodeURIComponent,
            encodeURI,
            encodeURIComponent,
            escape,
            unescape,
            atob,
            btoa
        };
        for (let el of globFuncs) {
            console.log("TODO:", el.name, globalVar[el.name])
        }
        var wrapped_functions = {
            json_parse: JSON.parse,
            json_stringify: JSON.stringify
        };
        for (let el of wrapped_functions) {
            console.log("TODO:", el.name, globalVar[el.name])
        }
    }
    // var fun_proto_toString = Function.prototype.toString;
    // defineProperty(Function.prototype, "toString", {
    //     value: function () {
    //         if (typeof this === 'function' && this.toString)
    //             return this.toString()
    //         return fun_proto_toString.apply(this)
    //     }
    // });
    // TODO:?
    // Map
    // Set
    // WeakMap
    // Active analysis on third party scripts Sniffing 
    // Keyboard Events?
    // XMLHttpRequest?
    // Fetch?
    // PostMessage?
    // Mouse Events?
    // Copy Paste Events?

    ////////////////////////////////////////////
    // Wrap them now! 
    //wrapObjectMethods();
    wrapArrayMethods();
    // This is to flush all the remaining data... 
    globalVar.addEventListener("beforeunload", function () {
        console.log("CCC");
    });
})();