(function () {
    console.log("DONE RIGHT SAVING JOIN")
    var array_join = Array.prototype.join;
    var PII_secret = "iamasecret";
    var id = 1
    var array = [id, PII_secret];


    function test2() {
        console.log("DONE RIGHT CALLING JOIN")
        var result = array_join.call(array);
        //Sec Stuff
        console.log(result);
    }
    test2();

    function check(event) {
        if (event.target === document.getElementById('right'))
            test2();
    }
    document.addEventListener("click", check);
})();