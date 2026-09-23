
export class CopyNameCreator {

    public createNewName(name: string): string {
        const match = name.match(/^(.*)Kopie(\s*)([0-9]*)$/);
        if (match) {
            const baseName = match[1];
            const numberOfCopyAsString = match[3];
            const numberOfCopyAsNumber = Number(numberOfCopyAsString);
            const numberOfCopy = (isNaN(numberOfCopyAsNumber) ? 0 : numberOfCopyAsNumber);
            return baseName.trim() + ' Kopie ' + (numberOfCopy + 1);
        }
        return name.trim() + ' Kopie'
    }

}