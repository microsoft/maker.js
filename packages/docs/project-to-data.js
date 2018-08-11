var fs = require('fs');
var project = require('./dist/project.json');

function deepClean(obj) {
    if (typeof obj === 'object') {
        for (var prop in obj) {
            switch (prop) {
                case 'groups':
                case 'kind':
                case 'id':
                    delete obj[prop];
                    break;
                default:
                    deepClean(obj[prop]);
            }
        }
    }
    return obj;
}

function cleanParameters(parameters) {
    return parameters.map(function (p) {
        var parameter2 = {};
        for (var prop in p) {
            switch (prop) {
                case 'id':
                case 'kind':
                case 'kindString':
                    //case 'flags':
                    continue;

                case 'comment':
                    parameter2.comment = p.comment.text;
                    break;

                case 'type':
                    parameter2.type = p.type.name;
                    break;

                default:
                    parameter2[prop] = deepClean(p[prop]);
            }
        }
        return parameter2;
    });
}

function cleanSignatures(signatures, kind, newChild) {

    function addSignature(kindString, signature) {
        var dest;
        if (kindString === 'Constructor signature') {
            dest = kind;
        } else {
            dest = newChild;
        }
        dest.signatures = dest.signatures || [];
        dest.signatures.push(signature);
    }

    signatures.forEach(function (s) {
        var signature2 = {};
        for (var prop in s) {
            switch (prop) {
                case 'id':
                case 'kind':
                case 'flags':
                    continue;

                case 'type':
                    signature2.type = s.type.name;
                    break;

                case 'parameters':
                    signature2.parameters = cleanParameters(s.parameters);
                    break;

                default:
                    signature2[prop] = deepClean(s[prop]);
            }
        }
        addSignature(s.kindString, signature2);
    });
}

function processChild(parent, child) {
    if (child.flags && child.flags.isPrivate) return;

    var kind = parent[child.kindString] = parent[child.kindString] || {};
    var newChild = kind[child.name] = kind[child.name] || {};

    for (var prop in child) {
        switch (prop) {
            case 'children':
            //case 'flags':
            case 'groups':
            case 'id':
            case 'kind':
            case 'kindString':
            case 'name':
                //case 'sources':
                //skip
                continue;

            case 'signatures':
                cleanSignatures(child.signatures, kind, newChild);
                break;

            default:
                newChild[prop] = deepClean(child[prop]);
        }
    }

    if (child.children) {
        child.children.forEach(function (grandChild) {
            processChild(newChild, grandChild);
        });
    }

}

var project2 = {};

project.children.forEach(
    function (externalModule) {
        if (externalModule.children) {
            externalModule.children.forEach(function (child) {
                if (child.kindString === 'Module' && child.name === 'MakerJs') {
                    child.children.forEach(function (grandChild) {
                        processChild(project2, grandChild);
                    });
                }
            });
        }
    }
);

process.stdout.write(JSON.stringify(project2, null, 2));
