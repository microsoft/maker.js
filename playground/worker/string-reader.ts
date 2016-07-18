class StringReader implements NodeJS.WritableStream {

    public data: string[] = [];

    constructor(public complete: (stringData: string) => void) {
    }

    public addListener(event: string, listener: Function): this {
        return this;
    }

    public on(event: string, listener: Function): this {
        return this;
    }

    public once(event: string, listener: Function): this {
        return this;
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