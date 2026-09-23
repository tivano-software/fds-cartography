import { FileNameStringHTML, URLParamString } from "../../types/template-types/file-name-string.type";


export class URLHandleElement {

    constructor(
        public readonly paramList: string[]
    ) {}

    public get paramListString(): string {
        return this.paramList.join('&');
    }

    public toURL<Base extends FileNameStringHTML>(base: Base): URLParamString<Base> {
        return `${base}?${this.paramListString}`;
    }

    public open<Base extends FileNameStringHTML>(base: Base): void {
        const url = this.toURL(base);
        window.open(url, '_self');
    }

    public updateURL<Base extends FileNameStringHTML>(base: Base): void {
        const url = this.toURL(base);
        window.history.replaceState({}, '', url);
    }
}