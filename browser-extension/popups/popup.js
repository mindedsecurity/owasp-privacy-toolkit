console.log("Hello from extension popup!");

function updateOversharingResults(){
    var now = new Date();
    var score = 3.5;
    document.querySelector(".oversharing-results .last-updated").textContent = `${now.getHours()}:${now.getMinutes()}`;
    document.querySelector(".oversharing-results .score").textContent = `${score}`;

}

function updateReferrerResults(data){
    var now = new Date();
    var score = 3.5;
    document.querySelector(".referrer-results .last-updated").textContent = `${now.getHours()}:${now.getMinutes()}`;
    document.querySelector(".referrer-results .score").textContent = `${score}`;
    //TODO: migrate to append mode
    document.querySelector(".referrer-results .data").textContent = `Exposes ${data.leak_type} ${data.leak_url} to ${data.to_url}`;

    console.log("%c Exposes %s %s to %s", `color: ${risk === 3 ? "red" : (risk === 2 ? "orange" : "yellow")}; font-size: 2em;`, data.leak_type, data.leak_url, data.to_url)

}

async function showOversharingReport() {
    window.location.href = "/popups/oversharing/oversharing.html";

}

async function showReferrerReport() {
    window.location.href = "/popups/referrer/index.html";

}

async function showGlobalRefsReport() {
    window.location.href = "/popups/global_refs/index.html";
}

async function showScriptLoadingReport() {
    window.location.href = "/popups/script_loading/index.html";
}


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if(request.msg == "toolkit_results"){
            window.toolkitDataStore = request.data
            console.log("dataSTORE", toolkitDataStore)
        }
    }
);


document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("oversharing-report-btn").addEventListener("click", showOversharingReport);
    document.getElementById("referrer-report-btn").addEventListener("click", showReferrerReport);
    document.getElementById("globalrefs-report-btn").addEventListener("click", showGlobalRefsReport);
    document.getElementById("scriptloading-report-btn").addEventListener("click", showScriptLoadingReport);
});

function getToolkitData() {
    chrome.runtime.sendMessage({type: "getToolkitResults"},
        function (response) {
            window.toolkitDataStore = response.data
        });
}

console.log("Asking for global toolkit results...");
getToolkitData();  
