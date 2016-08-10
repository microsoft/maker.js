namespace MakerJsPlaygroundRender {

    export interface IRenderRequest {
        requestId: number;
        orderedDependencies?: { [id: string]: string };
        javaScript?: string;
        paramValues: any[]
    }

    export interface IRenderResponse {
        requestId: number;
        model?: MakerJs.IModel;
        html?: string;
        error?: string;
    }
}
