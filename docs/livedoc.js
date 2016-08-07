function getAllCodes() {
    return document.body.querySelectorAll('code');
}

function getLastCode() {
    var allCodes = getAllCodes();
    return allCodes[allCodes.length - 1];
}

function evalLastCode() {
    var code = getLastCode();
    eval(code.innerText);
}

function tryIt(codeIndex) {
    var allCodes = getAllCodes();
    var code = allCodes[codeIndex];

    window.getcode = function () {
        return code.innerText;
    };

    var iframe = document.createElement('iframe');
    iframe.src = 'http://microsoft.github.io/maker.js/playground/embed.html?parentload=getcode';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';

    var pre = code.parentElement;
    pre.style.display = 'none';
    pre.parentElement.appendChild(iframe);
}

window.addEventListener("load", function load(event) {
    window.removeEventListener("load", load, false); //remove listener, no longer needed
    
    var allCodes = getAllCodes();

    for (var i = 0; i < allCodes.length; i++) {
        //add a button

        var code = allCodes[i];
        var pre = code.parentElement;

        var button = '<button onclick="tryIt(' + i + ')" style="display:none" >try it now</button>';
        pre.insertAdjacentHTML('afterend', button);
    }



}, false);
