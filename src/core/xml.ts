module MakerJs.exporter {

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
        public static escapeString(value: string): string {
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
        public toString(): string {
            var attrs = '';

            for (var name in this.attrs) {
                var value = this.attrs[name];

                if (typeof value == 'string') {
                    value = XmlTag.escapeString(value);
                }

                attrs += ' ' + name + '="' + value + '"';
            }

            var closeTag = '/>';

            if (this.innerText) {
                closeTag = '>';

                if (this.innerTextEscaped) {
                    closeTag += this.innerText;
                } else {
                    closeTag += XmlTag.escapeString(this.innerText);
                }

                closeTag += '</' + this.name + '>';
            }

            return '<' + this.name + attrs + closeTag;
        }
    }
}
