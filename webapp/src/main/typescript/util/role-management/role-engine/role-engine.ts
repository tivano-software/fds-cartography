import { Knockout, Observable } from "../../knockout";

export class RoleEngine {
    private map: Map<string, Observable<string>>;

    constructor(private ko: Knockout) {
        this.map = new Map<string, Observable<string>>();
    }

    giveUserAccessFor(role: string): void {
        this.set(role, "ACCESS");
    }

    hasUserAccessFor(role: string, ko: Knockout): Observable<string> {
        const access = this.map.get(role);
        if (access === undefined) {
            return this.set(role, undefined);
        }
        return access;
    }

    private set(key: string, value: string | undefined): Observable<string> {
        let observable = this.map.get(key);
        if (observable === undefined) {
            observable = this.ko.observable<string>(undefined);
            this.map.set(key, observable);
        }
        observable(value);
        return observable;
    }
}