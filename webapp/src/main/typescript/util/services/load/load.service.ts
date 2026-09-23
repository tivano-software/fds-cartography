import { Delimiter } from "../../types/template-types/delimiter.type";
import { FileNameString, FileNameStringCSV, FileNameStringJSON, FileNameSuffixString, InnerPathString } from "../../types/template-types/file-name-string.type";

export class LoadService {

    public readonly load = async <Suffix extends FileNameSuffixString>(url: FileNameString<Suffix>): Promise<Response> => {
        if (!url) {
            throw 'url can\' be undefined.';
        }
        return await fetch(url);
    };

    public readonly loadByBase = async <Suffix extends FileNameSuffixString>(base: InnerPathString, file: FileNameString<Suffix>): Promise<Response> => {
        if (!base || !file) {
            throw 'base and file can\' be undefined.';
        }
        return this.load(`${base}${file}`);
    };

    public readonly loadJSON = async <A extends object>(url: FileNameStringJSON): Promise<A> => {
        const result = await this.load(url);
        return await result.json() as A;
    }

    public readonly loadJSONByBase = async <A extends object>(base: InnerPathString, file: FileNameStringJSON): Promise<A> => this.loadJSON(`${base}${file}`);

    public readonly loadCSV = async (url: FileNameStringCSV, delimiter: Delimiter): Promise<string[][]> => {
        const result = await this.load(url);
        const data = await result.text();
        return data.split('\n').map(line => line.split(delimiter));
    }

    public readonly loadCSVByBase = async (base: InnerPathString, file: FileNameStringCSV, delimiter: Delimiter): Promise<string[][]> => this.loadCSV(`${base}${file}`, delimiter);

    public readonly loadBlob = async <Suffix extends FileNameSuffixString>(url: FileNameString<Suffix>): Promise<Blob> => {
        const result = await this.load(url);
        return await result.blob();
    }

    public readonly loadBlobByBase = async <Suffix extends FileNameSuffixString>(base: InnerPathString, file: FileNameString<Suffix>): Promise<Blob> => this.loadBlob(`${base}${file}`);

}
