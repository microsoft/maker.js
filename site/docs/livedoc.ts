namespace LiveDoc {

    function getAllCodes() {
        return document.body.querySelectorAll('code');
    }

    export function evalLastCode() {
        var allCodes = getAllCodes();
        var code = allCodes.item(allCodes.length - 1) as HTMLElement;

        document.write('<div class="code-output" id="' + codeOutputId(allCodes.length - 1) + '">')
        document.write('<p>Example output:</p>')

        eval(code.innerText);

        document.write('</div>')
    }

    function codeOutputId(i: number) {
        return 'code-output-' + i;
    }

    export function tryIt(codeIndex: number) {
        var allCodes = getAllCodes();
        var code = allCodes.item(codeIndex) as HTMLElement;
        var codeText = code.innerText;
        var pre = code.parentElement;
        var button = pre.previousSibling as HTMLElement;

        if (button.classList.contains('wait')) return;
        button.classList.add('wait');

        var iframe = document.createElement('iframe');
        iframe.className = 'play';
        iframe.src = '/playground/embed.html?parentload=getcode';
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        iframe.style.display = 'none';

        pre.parentElement.appendChild(iframe);

        window['getcode'] = function () {

            pre.style.display = 'none';
            button.style.display = 'none';

            var svg = document.getElementById(codeOutputId(codeIndex));
            if (svg) {
                svg.style.display = 'none';
            }

            iframe.style.display = '';

            return codeText;
        };

    }

    window.addEventListener("load", function load(event) {
        window.removeEventListener("load", load, false); //remove listener, no longer needed

        var allCodes = getAllCodes();

        for (var i = 0; i < allCodes.length; i++) {
            //add a button

            var code = allCodes.item(i) as HTMLElement;
            var codeText = code.innerText;
            var keywordPos = codeText.toLowerCase().indexOf('//');  //if code block begins with a comment, then show a Play button
            if (!(keywordPos === 0)) continue;

            var pre = code.parentElement;

            var button = '<button class="livedoc-play" onclick="LiveDoc.tryIt(' + i + ')">&nbsp;&#x25BA; Play&nbsp;</button>';
            pre.insertAdjacentHTML('beforebegin', button);
        }



    }, false);
}