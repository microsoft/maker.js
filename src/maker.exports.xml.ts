module Maker.Exports {

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
 