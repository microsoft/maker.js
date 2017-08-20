namespace MakerJs.exporter {

    /**
     * Attributes for an XML tag.
     * @private
     */
    export interface IXmlTagAttrs {
        [name: string]: any;
    }

    /**
     * Class for an XML tag.
     * @private
     */
    export class XmlTag {

        /**
         * Text between the opening and closing tags.
         */
        public innerText = '';

        /**
         * Boolean to indicate that the innerText has been escaped.
         */
        public innerTextEscaped: boolean;

        /**
         * Flag to explicitly close XML tags.
         */
        public closingTags?: boolean;

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
         * Get the opening tag.
         * 
         * @param selfClose Flag to determine if opening tag should be self closing.
         */

        public getOpeningTag(selfClose: boolean) {
            var attrs = '';

            function outputAttr(attrName: string, attrValue: any) {

                if (attrValue == null || typeof attrValue === 'undefined') return;

                if (Array.isArray(attrValue) || typeof attrValue === 'object') {
                    attrValue = JSON.stringify(attrValue);
                }

                if (typeof attrValue === 'string') {
                    attrValue = XmlTag.escapeString(attrValue);
                }

                attrs += ' ' + attrName + '="' + attrValue + '"';
            }

            for (var name in this.attrs) {
                outputAttr(name, this.attrs[name]);
            }

            return '<' + this.name + attrs + (selfClose ? '/' : '') + '>';
        }

        /**
         * Get the inner text.
         */
        public getInnerText(): string {
            if (this.innerTextEscaped) {
                return this.innerText;
            } else {
                return XmlTag.escapeString(this.innerText);
            }
        }

        /**
         * Get the closing tag.
         */
        public getClosingTag() {
            return '</' + this.name + '>';
        }

        /**
         * Output the entire tag as a string.
         */
        public toString(): string {
            var selfClose = !this.innerText;
            if (selfClose && !this.closingTags) {
                return this.getOpeningTag(true);
            } else {
                return this.getOpeningTag(false) + this.getInnerText() + this.getClosingTag();
            }
        }

    }
}
