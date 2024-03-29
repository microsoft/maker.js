var fs = require('fs');
var project = require('../dist/project.json');

function findNamespace(context, namespaceArray) {
    if (context.children) {
        for (var i = 0; i < context.children.length; i++) {
            var child = context.children[i];
            if ('name' in child && child.name === namespaceArray[0]) {
                if (namespaceArray.length === 1) {
                    return child;
                } else {
                    return findNamespace(child, namespaceArray.slice(1));
                }
            }
        }
    }
}

function isCascadable(fn) {
    var cascadable = false;
    fn.signatures.forEach(function (sig) {
        if (sig.parameters && sig.parameters[0].type.name === sig.type.name) {
            cascadable = true;
        } else {
            return false;
        }
    });
    return cascadable;
}

function getComment(sig) {
    var params = sig.parameters.slice(1).map(function (param) {
        var defaultValue = 'defaultValue' in param ? `(default ${param.defaultValue.trim()}) ` : '';
        return `${indent2} * @param ${param.name} ${defaultValue}${param.comment ? param.comment.text : '????????????????????????????'}`;
    });

    params.push(`${indent2} * @returns this cascade container, this.$result will be ${sig.comment.returns}`);

    return `\n${indent2}/**\n${indent2} * ${sig.comment.shortText}\n${indent2} * \n${params.join('\n')}\n${indent2} */`;
}

function getCode(name, sig, interfaceName) {
    var params = sig.parameters.slice(1).map(function (param) {
        var optional = (param.flags.isOptional || 'defaultValue' in param) ? '?' : '';
        var typename = (param.type.type === 'array') ? param.type.elementType.name + '[]' : param.type.name;
        return `${param.name}${optional}: ${typename}`;
    });
    return `${indent2}${name}(${params.join(', ')}): ${interfaceName};`;
}

function getCascadable(project, namespaceArray, interfaceName) {
    var functionArray = [];
    project.children.forEach(
        function externalModules(child, i) {
            var namespace = findNamespace(child, namespaceArray);
            if (namespace) {
                var exportedFunctions = namespace.children.filter(function (c2) {
                    return c2.kindString === 'Function';
                });
                if (exportedFunctions) {
                    exportedFunctions.forEach(function (ef) {
                        if (!isCascadable(ef) || ef.flags.isPrivate) return;
                        functionArray.push({
                            comment: getComment(ef.signatures[0]),
                            code: getCode(ef.name, ef.signatures[0], interfaceName)
                        });
                    });
                }
            }
        }
    );
    return functionArray.sort(function (a, b) {
        var key = 'code';
        if (a[key] < b[key]) {
            return -1;
        } else if (a[key] > b[key]) {
            return 1;
        }
        return 0;
    });
}

function describe(name) {
    var interfaceName = `ICascade${name}`;
    var cascadables = getCascadable(project, ["MakerJs", name.toLowerCase()], interfaceName);
    var innerContent = cascadables.map(function (c) {
        return `${c.comment}\n${c.code}`;
    });
    return `${indent}export interface ${interfaceName} extends ICascade {\n${innerContent.join('\n')}\n${indent}}\n`;
}

var indent = '    ';
var indent2 = indent + indent;
var content = ["Model", "Path", "Point"].map(describe);
var out = process.stdout;

out.write('//This file is generated by ./target/cascadable.js\n\n');
out.write('namespace MakerJs {\n\n');
out.write(content.join('\n'));
out.write('}\n');
