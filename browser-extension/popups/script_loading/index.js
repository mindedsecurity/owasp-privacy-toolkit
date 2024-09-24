console.log("Hello from referrer popup!");

function compare(a, b) {
    if (a.leak_url < b.leak_url) {
        return -1;
    }
    if (a.leak_url > b.leak_url) {
        return 1;
    }
    return 0;
}


function sortAndManipulate(data) {

    var res = {
        high: [],
        mid: [],
        low: []
    };

    for (x of data) {
        if (x.risk === 1)
            res.low.push(x);
        else if (x.risk === 2)
            res.mid.push(x);
        else
            res.high.push(x);
    }

    res.low.sort(compare)
    res.mid.sort(compare)
    res.high.sort(compare)

    return res;
}

function updateResults(results) {

    //results = sortAndManipulate(results);

    var tbody = document.querySelector(".resultsTable");
    tbody.innerHTML = "";

    console.log(results);

    function buildRow(entry){
        var row = document.createElement("TR");
        var td_1st = document.createElement("TD");
        var td_triggering = document.createElement("TD");
        var td_3rd = document.createElement("TD");

        var triggeringSrc = entry.requestedUrl.indexOf("#INLINE_SCRIPT") !== -1 ? "Inline Script" : entry.requestedUrl;

        td_1st.innerText = entry.initiatorHostname;
        td_triggering.innerText = triggeringSrc;
        td_3rd.innerText = entry.triggeredScriptUrl;

        row.appendChild(td_1st);
        row.appendChild(td_triggering);
        row.appendChild(td_3rd);

        tbody.appendChild(row);
    }

    // iterate over keys
    for (entry of results) {
        buildRow(entry);
    }
}

async function goBack() {
    window.location.href = "/popups/popup.html";

}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("back-btn").addEventListener("click", goBack);

});


function getToolkitData() {
    chrome.runtime.sendMessage({ type: "getToolkitResults" },
        function (response) {
            updateResults(response.data.scriptLoading)
        });
}

console.log("Asking for global toolkit results...");
getToolkitData();

console.log("Referrer Popup completed.");
