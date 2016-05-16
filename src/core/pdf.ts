namespace MakerJs.exporter {

    /**
     * Creates a string of PDF file with PDFKit.
     * 
     * @param modelToExport Model object to export.
     * @param options Export options object.
     * @returns String of PDF file contents.
     */
    export function toPDF(modelToExport: IModel, complete: IPDFRenderComplete, options?: IPDFRenderOptions) {
        if (!modelToExport) return '';

        var PDFDocument = require('pdfkit');

        //TODO: title, author from options

        var pdfOptions: PDFKit.PDFDocumentOptions = { compress: false, info: { Producer: 'MakerJs', Author: 'MakerJs' } };
        var doc: PDFKit.PDFDocument = new PDFDocument(pdfOptions);
        var reader = new PDFStreamReader(complete);
        var stream = doc.pipe(reader);

        var size = measure.modelExtents(modelToExport);

        var left = 0;
        if (size.low[0] < 0) {
            left = -size.low[0];
        }
        var offset = [left, size.high[1]];

        //TODO must specify units
        //TODO give some margin
        //TODO break model into page size blocks

        model.findChains(
            modelToExport,
            function (chains: IChain[], loose: IWalkPath[], layer: string) {

                function single(walkedPath: IWalkPath) {
                    var pathData = pathToSVGPathData(walkedPath.pathContext, walkedPath.offset);
                    doc.path(pathData).stroke();
                }

                chains.map(function (chain: IChain) {
                    if (chain.links.length > 1) {
                        var pathData = chainToSVGPathData(chain, offset);
                        doc.path(pathData).stroke();
                    } else {
                        var walkedPath = chain.links[0].walkedPath;
                        if (walkedPath.pathContext.type === pathType.Circle) {
                            var p = point.add(point.add(offset, walkedPath.pathContext.origin), walkedPath.offset)
                            doc.circle(p[0], p[1], (<IPathCircle>walkedPath.pathContext).radius).stroke();
                        } else {
                            single(walkedPath);
                        }
                    }
                });

                loose.map(single);

            },
            { byLayers: false }
        );

        doc.end();
    }

    class PDFStreamReader implements NodeJS.WritableStream {

        public data = '';

        constructor(public complete: IPDFRenderComplete) {
        }

        public addListener(event: string, listener: Function): NodeJS.EventEmitter {
            return this;
        }

        public on(event: string, listener: Function): NodeJS.EventEmitter {
            return this;
        }

        public once(event: string, listener: Function): NodeJS.EventEmitter {
            return this;
        }

        public removeListener(event: string, listener: Function): NodeJS.EventEmitter {
            return this;
        }

        public removeAllListeners(event?: string): NodeJS.EventEmitter {
            return this;
        }

        public setMaxListeners(n: number): void {
        }

        public listeners(event: string): Function[] {
            return [];
        }

        public emit(event: string, ...args: any[]): boolean {
            return true;
        }

        public writable: boolean;

        public write(buffer: Buffer | string, cb?: Function): boolean;
        public write(str: string, encoding?: string, cb?: Function): boolean;
        public write(...any) {
            var string = new TextDecoder("utf-8").decode(arguments[0]);
            this.data += string;
            return true;
        }

        public end(): void;
        public end(buffer: Buffer, cb?: Function): void;
        public end(str: string, cb?: Function): void;
        public end(str: string, encoding?: string, cb?: Function): void;
        public end() {
            this.complete(this.data);
        }

    }

    /**
     * jsPDF export options.
     */
    export interface IPDFRenderComplete {
        (pdfData: string): void;
    }

    /**
     * jsPDF export options.
     */
    export interface IPDFRenderOptions extends IExportOptions {
    }

}