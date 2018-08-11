interface TextDecodeOptions {
    stream?: boolean;
}

interface TextDecoder {
    readonly encoding: string;
    readonly fatal: boolean;
    readonly ignoreBOM: boolean;
    decode(input?: Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer | null, options?: TextDecodeOptions): string;
}

interface TextDecoderOptions {
    fatal?: boolean;
    ignoreBOM?: boolean;
}

declare var TextDecoder: {
    prototype: TextDecoder;
    new(label?: string, options?: TextDecoderOptions): TextDecoder;
};

class StringReader implements NodeJS.WritableStream {

    public data: string[] = [];

    constructor(public complete: (stringData: string) => void) {
    }

    public addListener(event: string, listener: Function): this {
        return this;
    }

    public off(event: string | symbol, listener: (...args: any[]) => void): this {
        return this;
    };

    public on(event: string, listener: Function): this {
        return this;
    }

    public once(event: string, listener: Function): this {
        return this;
    }

    public eventNames() {
        return [];
    }

    public prependListener() {
        return this;
    }

    public prependOnceListener() {
        return this;
    }

    public rawListeners(event: string | symbol): Function[] {
        return [];
    }

    public removeListener(event: string, listener: Function): this {
        return this;
    }

    public removeAllListeners(event?: string): this {
        return this;
    }

    public getMaxListeners(): number {
        return 1;
    }

    public setMaxListeners(n: number): this {
        return this;
    }

    public listeners(event: string): Function[] {
        return [];
    }

    public listenerCount(type: string): number {
        return 1;
    }

    public emit(event: string, ...args: any[]): boolean {
        return true;
    }

    public writable: boolean;

    public write(buffer: Buffer | string, cb?: Function): boolean;
    public write(str: string, encoding?: string, cb?: Function): boolean;
    public write(...any) {
        var string = new TextDecoder("utf-8").decode(arguments[0]);
        this.data.push(string);
        return true;
    }

    public end(): void;
    public end(buffer: Buffer, cb?: Function): void;
    public end(str: string, cb?: Function): void;
    public end(str: string, encoding?: string, cb?: Function): void;
    public end() {
        this.complete(this.data.join(''));
    }

}