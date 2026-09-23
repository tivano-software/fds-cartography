import { FileNameString, FileNameSuffixImageString, FileNameSuffixString } from "../../types/template-types/file-name-string.type";
import { LoadService } from "./load.service";

export class DownloadService {

    public async downloadBlob<Suffix extends FileNameSuffixString>(blob: Blob, fileName: FileNameString<Suffix>): Promise<void> {
        const url = window.URL || window.webkitURL;
        const file = url.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('download', fileName);
        a.setAttribute('href', file);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}