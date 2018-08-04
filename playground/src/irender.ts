namespace MakerJsPlaygroundRender {

    export interface IRenderRequest {
        fontDir: string;
        requestId: number;
        orderedDependencies?: string[];
        dependencyUrls?: { [id: string]: string };
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
