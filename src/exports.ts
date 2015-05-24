/// <reference path="model.ts" />
/// <reference path="units.ts" />
/// <reference path="measure.ts" />

module Maker.Exports {

    export class Exporter {

        constructor(
            public map: IMakerPathOriginFunctionMap,
            public fixPoint?: (point: IMakerPoint) => IMakerPoint,
            public fixPath?: (path: IMakerPath, origin: IMakerPoint) => IMakerPath 
            ) {
        }

        public exportPath(path: IMakerPath, origin: IMakerPoint) {
            var fn = this.map[path.type];
            if (fn) {
                fn(this.fixPath? this.fixPath(path, origin) : path, origin);
            }
        }

        public exportModel(model: IMakerModel, origin: IMakerPoint) {

            var newOrigin = Point.Add((this.fixPoint ? this.fixPoint(model.origin) : model.origin), origin);

            if (model.paths) {
                for (var i = 0; i < model.paths.length; i++) {
                    this.exportPath(model.paths[i], newOrigin);
                }
            }

            if (model.models) {
                for (var i = 0; i < model.models.length; i++) {
                    this.exportModel(model.models[i], newOrigin);
                }
            }
        }

        public exportItem(item: any, origin: IMakerPoint) {

            if (IsModel(item)) {
                this.exportModel(<IMakerModel>item, origin);

            } else if (IsArray(item)) {
                var items: any[] = item;
                for (var i = 0; i < items.length; i++) {
                    this.exportItem(items[i], origin);
                }

            } else if (IsPath(item)) {
                this.exportPath(<IMakerPath>item, origin);
            }
        }

    }

    export interface IXmlTagAttrs {
        [name: string]: any;
    }

    export class XmlTag {

        public innerText: string;
        public innerTextEscaped: boolean;

        public static EscapeString(value: string): string {
            var escape = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            };

            for (var code in escape) {
                //.split then .join is a 'replace'
                value = value.split(code).join(escape[code]);
            }

            return value;
        }

        constructor(public name: string, public attrs?: IXmlTagAttrs) {
        }

        public ToString(): string {
            var attrs = '';

            for (var name in this.attrs) {
                var value = this.attrs[name];

                if (typeof value == 'string') {
                    value = XmlTag.EscapeString(value);
                }

                attrs += ' ' + name + '="' + value + '"';
            }

            var closeTag = '/>';

            if (this.innerText) {
                closeTag = '>';

                if (this.innerTextEscaped) {
                    closeTag += this.innerText;
                } else {
                    closeTag += XmlTag.EscapeString(this.innerText);
                }

                closeTag += '</' + this.name + '>';
            }

            return '<' + this.name + attrs + closeTag;
        }
    }
}
