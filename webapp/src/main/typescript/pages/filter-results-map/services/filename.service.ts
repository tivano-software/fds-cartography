import { StringMapService } from "../../../util/services/string-map.service";
import { FileNameString } from "../../../util/types/template-types/file-name-string.type";
import { ViewModel } from "../view-models/view-model";


export class FilenameService {

    private readonly stringMapService = new StringMapService();

    public generate(model: ViewModel): FileNameString<'svg'> | void {
        const name = model.svg.settings.name();
        const id = model.svg.settings.configId();

        if (!id) {
            window.alert('Die Karte sollte zuerst gespeichert werden, dass im Dateiname eine Id gesetzt werden kann.');
            return;
        }

        if (!name) {
            window.alert('Die Karte hat keinen Namen.');
            return;
        }

        return this.template(this.formatId(id), name);
    }

    private template(id: string, name: string): FileNameString<'svg'> | void {
        const now = new Date();
        const date: string = this.formatDate(now);
        const time: string = this.formatTime(now);
        const formattedName: string = this.formatName(name);
        const result = this.stringMapService.createFilename(
            `${id}_${formattedName}_${date}_${time}`, '', 'svg'
        );
        // print the result to the console
        console.log(`Filename: ${result}`);
        return result;
    }

    /**
     * Shortens the card name to the first 15 characters, replacing all whitespace, special, and punctuation characters
     * (e.g., ä, ö, ü, ;, :, /, |, (, ), etc.) with an underscore. This ensures the filename remains within a reasonable length.
     *
     * @param name - The original name of the map.
     * @returns The modified name, limited to the first 15 characters with replacements made.
     */
    private formatName(name: string): string {
        const maxLength = 15;
        const shortenedName = name.substring(0, maxLength);
        return shortenedName.replace(/[^a-zA-Z0-9]/g, '_');
    }

    private formatId(id: number): string {
        return this.pad(id, 4);
    }

    private formatDate(date: Date): string {
        const year: number = date.getFullYear();
        const month: string = this.pad(date.getMonth() + 1, 2);
        const day: string = this.pad(date.getDate(), 2);
        return `${year}${month}${day}`;
    }

    private formatTime(now: Date): string {
        const formattedHours: string = this.pad(now.getHours(), 2);
        const formattedMinutes: string = this.pad(now.getMinutes(), 2);
        const formattedSeconds: string = this.pad(now.getSeconds(), 2);
        return `${formattedHours}${formattedMinutes}${formattedSeconds}`;
    }

    private pad(input: any, length: number, paddingChar: string = '0'): string {
        const inputStr: string = input.toString();
        const paddingLength: number = Math.max(0, length - inputStr.length);
        return paddingChar.repeat(paddingLength) + inputStr;
    }

}