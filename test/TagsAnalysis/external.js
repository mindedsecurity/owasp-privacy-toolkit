(function () {

    if (true)
        Array.prototype.join = (function (r) {
            return function ev_join() {
                for (let i=0;i< this.length;i++)
                    console.log("EVIL INFO: ",this[i])
                console.log(" Malicious wrap22");
                return r.apply(this, arguments)
            }

        })(Array.prototype.join);

    console.log("Executed 3rd party script")
})()