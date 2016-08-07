function getAllCodes() {
    return document.body.querySelectorAll('code');
}

function getLastCode() {
    var allCodes = getAllCodes();
    return allCodes[allCodes.length - 1];
}

function evalLastCode() {
    var allCodes = getAllCodes();
    var code = allCodes[allCodes.length - 1];

    document.write('<div id="' + codeOutputId(i) + '">')

    eval(code.innerText);

    document.write('</div>')
}

function codeOutputId(i) {
    return 'code-output-' + i;
}

function tryIt(codeIndex, button) {
    var allCodes = getAllCodes();
    var code = allCodes[codeIndex];

    window.getcode = function () {
        return code.innerText;
    };

    var iframe = document.createElement('iframe');
    iframe.className = 'trynow';
    iframe.src = 'https://microsoft.github.io/maker.js/playground/embed.html?parentload=getcode';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';

    var pre = code.parentElement;
    pre.style.display = 'none';
    pre.parentElement.appendChild(iframe);

    button.style.display = 'none';

    var svg = document.getElementById(codeOutputId(codeIndex));
    if (svg) {
        svg.style.display = 'none';
    }
}

window.addEventListener("load", function load(event) {
    window.removeEventListener("load", load, false); //remove listener, no longer needed
    
    var allCodes = getAllCodes();

    for (var i = 0; i < allCodes.length; i++) {
        //add a button

        var code = allCodes[i];
        var pre = code.parentElement;

        var button = '<button onclick="tryIt(' + i + ', this)" style="display:none" >try it now</button>';
        pre.insertAdjacentHTML('afterend', button);
    }



}, false);
