console.log("Hello from GlobalRefs popup!");

function updateResults(results) {

    var tbody = document.querySelector(".resultsTable");
    tbody.innerHTML = "";

    function buildRow(key, data){
        var row = document.createElement("TR");
        var td_leak = document.createElement("TD");
        var td_data = document.createElement("TD");

        for(el of data){
            var div_data = document.createElement("DIV");
            div_data.innerText = el[0];
            td_data.appendChild(div_data);
        }

        td_leak.innerText = key;

        row.appendChild(td_leak);
        row.appendChild(td_data);

        tbody.appendChild(row);
    }

    for (entry of results) {
        let res = JSON.parse(entry.result);
        if(res && res.length > 0)
            buildRow(entry.key, res);
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
            updateResults(response.data.globalRefs)
        });
}

console.log("Asking for global toolkit results...");
getToolkitData();

console.log("GlobalRefs Popup completed.");
