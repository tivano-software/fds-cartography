
export class Base64Service {

    public blobToBase64(blob: Blob): Promise<string | ArrayBuffer | null> {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        return new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }

}