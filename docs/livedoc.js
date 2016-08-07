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

    document.write('<div id="' + codeOutputId(allCodes.length - 1) + '">')
    document.write('<p>Example output:</p>')

    eval(code.innerText);

    document.write('</div>')
}

function codeOutputId(i) {
    return 'code-output-' + i;
}

function tryIt(codeIndex, button) {
    var allCodes = getAllCodes();
    var code = allCodes[codeIndex];

    var iframe = document.createElement('iframe');
    iframe.className = 'trynow';
    iframe.src = 'https://microsoft.github.io/maker.js/playground/embed.html?parentload=getcode';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.style.display = 'none';

    var pre = code.parentElement;
    pre.parentElement.appendChild(iframe);

    window.getcode = function () {

        pre.style.display = 'none';
        button.style.display = 'none';

        var svg = document.getElementById(codeOutputId(codeIndex));
        if (svg) {
            svg.style.display = 'none';
        }

        iframe.style.display = '';

        return code.innerText;
    };

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
