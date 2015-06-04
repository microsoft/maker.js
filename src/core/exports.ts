/// <reference path="model.ts" />
/// <reference path="units.ts" />
/// <reference path="measure.ts" />

module makerjs.exports {

    /**
     * Class to traverse an item 's models or paths and ultimately render each path.
     */
    export class Exporter {

    /**
     * @param map Object containing properties: property name is the type of path, e.g. "line", "circle"; property value 
     * is a function to render a path. Function parameters are path and point.
     * @param fixPoint Optional function to modify a point prior to export. Function parameter is a point; function must return a point.
     * @param fixPath Optional function to modify a path prior to output. Function parameters are path and offset point; function must return a path.
     */
        constructor(
            public map: IMakerPathOriginFunctionMap,
            public fixPoint?: (pointToFix: IMakerPoint) => IMakerPoint,
            public fixPath?: (pathToFix: IMakerPath, origin: IMakerPoint) => IMakerPath 
            ) {
        }

        /**
         * Export a path.
         * 
         * @param pathToExport The path to export.
         * @param offset The offset position of the path. 
         */
        public exportPath(pathToExport: IMakerPath, offset: IMakerPoint) {
            var fn = this.map[pathToExport.type];
            if (fn) {
                fn(this.fixPath? this.fixPath(pathToExport, offset) : pathToExport, offset);
            }
        }

        /**
         * Export a model.
         * 
         * @param modelToExport The model to export.
         * @param offset The offset position of the model.
         */
        public exportModel(modelToExport: IMakerModel, offset: IMakerPoint) {

            var newOffset = point.Add((this.fixPoint ? this.fixPoint(modelToExport.origin) : modelToExport.origin), offset);

            if (modelToExport.paths) {
                for (var i = 0; i < modelToExport.paths.length; i++) {
                    this.exportPath(modelToExport.paths[i], newOffset);
                }
            }

            if (modelToExport.models) {
                for (var i = 0; i < modelToExport.models.length; i++) {
                    this.exportModel(modelToExport.models[i], newOffset);
                }
            }
        }

        /**
         * Export an object.
         * 
         * @param item The object to export. May be a path, an array of paths, a model, or an array of models.
         * @param offset The offset position of the object.
         */
        public exportItem(item: any, origin: IMakerPoint) {

            if (IsModel(item)) {
                this.exportModel(<IMakerModel>item, origin);

            } else if (Array.isArray(item)) {
                var items: any[] = item;
                for (var i = 0; i < items.length; i++) {
                    this.exportItem(items[i], origin);
                }

            } else if (IsPath(item)) {
                this.exportPath(<IMakerPath>item, origin);
            }
        }

    }

    /**
     * Attributes for an XML tag.
     */
    export interface IXmlTagAttrs {
        [name: string]: any;
    }

    /**
     * Class for an XML tag.
     */
    export class XmlTag {

        /**
         * Text between the opening and closing tags.
         */
        public innerText: string;

        /**
         * Boolean to indicate that the innerText has been escaped.
         */
        public innerTextEscaped: boolean;

        /**
         * Escapes certain characters within a string so that it can appear in a tag or its attribute.
         * 
         * @returns Escaped string.
         */
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

        /**
         * @param name Name of the XML tag.
         * @param attrs Optional attributes for the tag. 
         */
        constructor(public name: string, public attrs?: IXmlTagAttrs) {
        }

        /**
         * Output the tag as a string.
         */
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
