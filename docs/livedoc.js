function evalLastPre() {
    var preAll = document.body.querySelectorAll('pre');
    var pre = preAll[preAll.length - 1];
    eval(pre.innerText);
}
