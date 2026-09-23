import { FileNameStringHTML, URLParamString } from "../../types/template-types/file-name-string.type";
import { LeavesMapperFromObject, LeavesMapperToObject } from "../../types/util-types/mapped-types/leaves-mapper.type";
import { URLHandleElement } from "./url-handle-element";
import { URLService } from "./url.service";

export class URLCustomHandleElement<Base extends FileNameStringHTML> {
    constructor(
        private readonly base: Base,
        private readonly urlHandleElement: URLHandleElement
    ) {}

    public get paramListString(): string {
        return this.urlHandleElement.paramListString;
    }

    public toURL(): URLParamString<Base> {
        return this.urlHandleElement.toURL(this.base);
    }

    public open(): void {
        const url = this.toURL();
        window.open(url, '_self');
    }

    public updateURL(): void {
        const url = this.toURL();
        window.history.replaceState({}, '', url);
    }
}

export class URLCustomService<A extends object> {
    private readonly urlService = new URLService();

    constructor(
        private readonly base: FileNameStringHTML,
        private readonly leavesMapperToObject: LeavesMapperToObject<A, string | null | undefined>,
        private readonly leavesMapper: LeavesMapperFromObject<A, string>
    ) {}

    public updateURLParamsByObject<Keys extends (keyof A)>(o: Pick<A, Keys>): void {
        this.urlService.updateURLParamsByObject(this.base, o, this.leavesMapperToObject, this.leavesMapper);
    }

    public createURLParamsByObject(o: A): URLCustomHandleElement<FileNameStringHTML> {
        const handler = this.urlService.createURLParamsByObject(o, this.leavesMapper);
        return new URLCustomHandleElement(this.base, handler);
    }

    public loadURLParamsByObject(): A | null {
        return this.urlService.loadURLParamsByObject(this.leavesMapperToObject);
    }
}