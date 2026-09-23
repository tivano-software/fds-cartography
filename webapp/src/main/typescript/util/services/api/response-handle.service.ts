import { ErrorMessage } from "../../../client";
import { Messageable } from "../../messaging";

export class ResponseHandleService {
    public async handleResponseError(errorInput: any, messageable: Messageable): Promise<void> {
        if (typeof errorInput.json !== 'function' || !('json' in errorInput)) {
            messageable.getMessagingHandler().registerError("Es ist ein unbekannter Fehler aufgetreten.").show();
            console.error(errorInput);
            return;
        }
        var error = errorInput as Response;
        return await error.json().then((json: ErrorMessage) => {
            const details = json.details;
            if (details !== undefined && details !== null) {
                messageable.getMessagingHandler().registerError(details).show();
            } else {
                messageable.getMessagingHandler().registerError(JSON.stringify(json)).show();
            }
        }).catch(error => {
            messageable.getMessagingHandler().registerError(JSON.stringify(error)).show();
        });
    }
}