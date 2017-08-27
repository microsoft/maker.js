var fs = require('fs');
var project = require('../target/project.json');

function docName(name) {
    switch (name) {
        case 'IPathArc':
        case 'IPathCircle':
        case 'IPathLine':
        case 'IPathBezierSeed':
        case 'IPathArcInBezierCurve':
            return name.substring(5);

        default:
            var first1 = name.substr(0, 1);
            if (first1 == 'I') {

                var first2 = name.substr(0, 2);
                if (first2.toUpperCase() == first2) {
                    return name.substring(1);
                }
            }
            return name;
    }
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
                    if (p.type.name) {
                        parameter2.type = docName(p.type.name);
                    }
                    break;

                default:
                    parameter2[prop] = p[prop];
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
                    if (s.type.name) {
                        signature2.type = docName(s.type.name);
                    }
                    break;

                case 'parameters':
                    signature2.parameters = cleanParameters(s.parameters);
                    break;

                default:
                    signature2[prop] = s[prop];
            }
        }
        addSignature(s.kindString, signature2);
    });
}

function processChild(parent, child) {
    if (child.flags && child.flags.isPrivate) return;

    var kind = parent[child.kindString] = parent[child.kindString] || {};
    var name = docName(child.name);
    var newChild = kind[name] = kind[name] || {};

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

            case 'type':
                var t = child[prop];
                if (t.name) t.name = docName(t.name);
                newChild.type = t;
                break;

            case 'signatures':
                cleanSignatures(child.signatures, kind, newChild);
                break;

            default:
                newChild[prop] = child[prop];
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
