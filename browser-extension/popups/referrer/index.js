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
    var now = new Date();
    var score = 3.5;

    results = sortAndManipulate(results);

    var tbody = document.querySelector(".resultsTable");
    tbody.innerHTML = "";

    function buildRow(entry, risk){
        var row = document.createElement("TR");
        var td_leak = document.createElement("TD");
        var td_risk = document.createElement("TD");
        var td_type = document.createElement("TD");
        var td_to = document.createElement("TD");

        td_leak.innerText = entry.leak_url;
        td_risk.innerText = risk;
        td_type.innerText = entry.leak_type;
        td_to.innerText = entry.to_url;

        row.appendChild(td_leak);
        row.appendChild(td_risk);
        row.appendChild(td_type);
        row.appendChild(td_to);

        tbody.appendChild(row);
    }

    //iterate over keys
    for (entry of results.high) {
        buildRow(entry, "High");
    }
    for (entry of results.mid) {
        buildRow(entry, "Medium");
    }
    for (entry of results.low) {
        buildRow(entry, "Low");
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
            updateResults(response.data.referrer)
        });
}

console.log("Asking for global toolkit results...");
getToolkitData();

console.log("Referrer Popup completed.");
