console.log("Hello from oversharing popup!");

function updateResults(results){
    var now = new Date();
    var score = 3.5;

    var tbody = document.querySelector(".resultsTable");
    tbody.innerHTML = "";

    //iterate over keys
    for(entry in results){
        var row = document.createElement("TR");
        var td_api = document.createElement("TD");
        var td_data = document.createElement("TD");
        var td_score = document.createElement("TD");

        td_api.innerText = entry.split('?')[0];


        for(dataEl in results[entry]){
            var el = document.createElement("DIV");
            el.innerText = dataEl;
            el.classList = results[entry][dataEl] ? "dataUsed" : "dataUnused";
            
            td_data.appendChild(el);
        }

        td_score.innerText = score;

        row.appendChild(td_api);
        row.appendChild(td_data);
        row.appendChild(td_score);

        tbody.appendChild(row);
    }

}

async function goBack() {
    window.location.href="/popups/popup.html";

}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("back-btn").addEventListener("click", goBack);

});

var dataStore = {};

function getToolkitData() {
    chrome.runtime.sendMessage({ type: "getToolkitResults" },
        function (response) {
            updateResults(response.data.oversharing)
        });
}

console.log("Asking for global toolkit results...");
getToolkitData();

console.log("Oversharing Popup completed.");
  