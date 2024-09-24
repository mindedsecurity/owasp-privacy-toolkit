/**
 * {
 * [tabId]{
 *   [documentId]: {
 *     [url]: {
 *        [row:cols]:{ 
 *           get:  true|false,
 *           set:  true|false,
 *           call: true|false
 *        }
 *   }
 * 
 * }
 * }
 * }
 */
var proto_infos = {};

function set_proto_data(obj) {
    var tabId = obj.tabId;
    var documentId = obj.documentId;
    var ref = obj.res;
    proto_infos[tabId] = proto_infos[tabId] || {};
    proto_infos[tabId][documentId] = proto_infos[tabId][documentId] || {};

    // we just copy the get+call spots. (in the future might be useful to also store the arguments?)
    Object.keys(ref).forEach((url) => {
        if (getHasThirdPartyScript(tabId, documentId)) {
            proto_infos[tabId][documentId][url] = true;
            console.log('%c ERROR!!!! ', 'color:red', `CALL ON SAME SPOT!!! URL: ${url}`);
        }
    });
}
function set_proto_data_old(obj) {
    var res = obj;

    var tabId = obj.tabId;
    var documentId = obj.documentId;
    var ref = res.url;
    var row_cols = `${res.row}:${res.col}`;

    proto_infos[tabId] = proto_infos[tabId] || {};
    proto_infos[tabId][documentId] = proto_infos[tabId][documentId] || {};
    proto_infos[tabId][documentId][ref] = proto_infos[tabId][documentId][ref] || {};
    var obj_ref = proto_infos[tabId][documentId][ref];
    obj_ref[row_cols] = obj_ref[row_cols] || {};

    switch (res.type) {
        case "get": // Are we saving data or are we just accessing the function?
            obj_ref[row_cols]['get'] = true;
            break;
        case "call":
            // if we GETTER AND CALLER are on the same spot, then it's a problem!
            if (obj_ref[row_cols]['get']) {
                //console.log('%c ERROR!!!! ', 'color:red', `CALL ON SAME SPOT!!! URL: ${ref} ${row_cols} ${res.time}`);
                //delete obj_ref[row_cols]['get'];
            } else {
                // we need now to check if the GETTER is from a 3rd party script.
                // DO WE NEED TO USE TIME?
                // LIKE: it's been calling now, what's the previous getter?
                //console.log("%c THAT's OK ", "color:blue", `CALL ON!!! URL: ${ref} ${row_cols} ${res.time}`);
                obj_ref[row_cols]['call'] = true;
            }
            break;
        case "set":
            console.log(` YOOO SET !!!  PROTOTYPE! ${res.time} ${res.function_name} ${res.type}, ${res.url}, ${res.row},${res.col}`, res.debug_full);
            obj_ref[row_cols]['set'] = true;
            break;
    }

}

function proto_trigger() {

}