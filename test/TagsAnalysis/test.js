(function () {
  var PII_secret = "iamasecret";
  var id = 1
  var array = [id, PII_secret];

  console.log("DONE WRONG GET+CALL JOIN 1")
  var result = array.join();

  function test() {
    console.log("DONE WRONG GET+CALL JOIN 2")
    var result = array.join();
    console.log(result);
    //Sec Stuff
  }

  test();

  function check(event) {
    if (event.target === document.getElementById('wrong'))
      test();
  }
  document.addEventListener("click", check);
})();