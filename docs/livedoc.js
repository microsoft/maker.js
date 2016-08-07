function evalLastCode() {
    var allCodes = document.body.querySelectorAll('code');
    var code = allCodes[allCodes.length - 1];
    eval(code.innerText);
}
