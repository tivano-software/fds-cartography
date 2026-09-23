import { FileNameString, FileNameSuffixString } from "../types/template-types/file-name-string.type";

export class StringMapService {

    public createFilenameByListNotNull<Suffix extends FileNameSuffixString>(
        list: string[],
        prefix: string,
        suffix: Suffix,
        seperator: '_'
    ): FileNameString<Suffix> {
        const result = list.join(seperator);
        return `${prefix}${result}.${suffix}`;
    }

    public createFilenameNotNull<Suffix extends FileNameSuffixString>(name: string, prefix: string, suffix: Suffix): FileNameString<Suffix> {
        return `${prefix}${name}.${suffix}`;
    }

    public createFilename<Suffix extends FileNameSuffixString>(name: string | undefined, prefix: string, suffix: Suffix):
        FileNameString<Suffix> | undefined {
        if (name === undefined) {
            return undefined;
        }
        return this.createFilenameNotNull(name, prefix, suffix);
    }

    public capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);;
    }

}