import { UserRolesEnum, UsersApi } from "../../../client";
import { API_CONFIG } from "../../../conf/api.const";
import { Knockout, Observable, ObservableArray } from "../../../util/knockout";
import { ComputedNotNull, ObservableNotNull } from "../../../util/knockout/lib/knockout.interface";
import { MessagingHandler } from "../../../util/messaging";

export interface CheckedRole {
    readonly role: ObservableNotNull<UserRolesEnum>;
    readonly checked: ObservableNotNull<boolean>;
};

export class UserObservable implements UserObservable {

    private readonly api: UsersApi;
    public readonly id: Observable<number>;
    public readonly email: Observable<string>;
    public readonly rolesAll: ObservableArray<CheckedRole>;
    public readonly roles: ComputedNotNull<UserRolesEnum[]>;

    constructor(
        private readonly ko: Knockout,
        private readonly messageHandler: MessagingHandler
    ) {
        this.api = new UsersApi(API_CONFIG);
        this.id = ko.observable<number>(undefined);
        this.email = ko.observable<string>('');
        this.rolesAll = ko.observableArray<CheckedRole>([]);
        this.roles = ko.computed(() => this.rolesAll().filter(val => val.checked()).map(val => val.role()));
    }

    public setRoles(roles: UserRolesEnum[]): void {
        this.rolesAll.removeAll();
        Object.keys(UserRolesEnum).forEach(val => {
            const role = val as UserRolesEnum;
            const roleSetted = roles.indexOf(role) > -1;
            const entry = {
                role: this.ko.observable(role),
                checked: this.ko.observable(roleSetted),
            };
            entry.checked.subscribe(async (checked) => {
                if (checked === undefined) {
                    return;
                }
                const roleOld = this.roles() as UserRolesEnum[];
                let roles;
                if (checked) {
                    roleOld.push(role);
                    roles =  new Set(roleOld);
                } else {
                    roles =  new Set(roleOld.filter(local => local != role));
                }
                const email = this.email();
                await this.api.updateUser({
                    id: this.id() as number,
                    user: { email, roles },
                }).then(val => {
                    const msg = "Die Rollen von " + email + " wurden erfolgreich ge\u00e4ndert.";
                    this.messageHandler.removeSuccess(msg);
                    this.messageHandler.registerSuccess(msg).show();
                }).catch(error => {
                    const msg = "Die Rollen konnten nicht ge\u00e4ndert werden.";
                    this.messageHandler.removeError(msg);
                    this.messageHandler.registerError(msg);
                    entry.checked(undefined);
                });
            })
            this.rolesAll.push(entry);
        });
    }

    public clear(): void {
        this.id(undefined);
        this.email('');
        this.rolesAll().forEach(val => {
                val.checked(false);
        });
    }
}