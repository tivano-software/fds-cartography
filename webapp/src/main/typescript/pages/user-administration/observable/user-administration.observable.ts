import { User, ExistingUser, UserRolesEnum } from "../../../client";
import { Knockout, ObservableArray } from "../../../util/knockout";
import { ObservableNotNull } from "../../../util/knockout/lib/knockout.interface";
import { extendedList, ExtendedListObservable } from "../../../util/knockout/list/extended-list.observable";
import { Messageable, MessagingHandler, MessagingObservable } from "../../../util/messaging";
import { mapUserRolesEnum } from "../../../util/services/mapper";
import { UndefinedNullableService } from "../../../util/services/undefined-nullable.service";
import { Comporator } from "../../../util/types";
import { CreateUserObservable } from "./create-user.observable";
import { UserObservable } from "./user.observable";

export class UserAdministrationObservable implements Messageable {

    public readonly title: ObservableNotNull<string>;
    public readonly users: ExtendedListObservable<UserObservable>;
    public readonly createUser: CreateUserObservable;
    public readonly ressources: {
        roles: ObservableArray<UserRolesEnum>
    };
    public readonly messages: MessagingObservable;

    constructor(private ko: Knockout) {
        this.messages = new MessagingObservable(ko);
        this.title = ko.observable<string>('');
        this.createUser = new CreateUserObservable(ko, this.getMessagingHandler());
        const service = new UndefinedNullableService();
        const COMP: Comporator<UserObservable> = (u1, u2) => service.compareNumber(u1.id(), u2.id());
        this.users = extendedList<UserObservable>(ko, [], {
            itemsPerPage: 20,
        });
        this.users.setSortStrategy(COMP);
        this.ressources = {
            roles: ko.observableArray<UserRolesEnum>([]),
        }
    }

    public getMessagingHandler(): MessagingHandler {
        return new MessagingHandler(this.messages);
    }

    public init(): void {
        Object.keys(UserRolesEnum).forEach(val => {
            this.ressources.roles.push(val as UserRolesEnum);
        });
    }

    public addExistingUser(user: ExistingUser): void {
        const userObservable = new UserObservable(this.ko, this.getMessagingHandler());
        userObservable.email(user.email);
        userObservable.id(user.id);
        if (user.roles) {
            const roles: UserRolesEnum[] = [];
            user.roles.forEach(role => roles.push(mapUserRolesEnum(role)));
            userObservable.setRoles(roles);
        }
        this.users.push(userObservable);
    }

    public addUser(user: User): void {
        const userObservable = new UserObservable(this.ko, this.getMessagingHandler());
        userObservable.email(user.email);
        if (user.roles) {
            const roles: UserRolesEnum[] = [];
            user.roles.forEach(role => roles.push(role));
            userObservable.setRoles(roles);
        }
        this.users.push(userObservable);
    }

    public clearUsers(): void {
        this.users.removeAll();
    }
}

export function createUserAdministration(ko: Knockout): UserAdministrationObservable {
    return new UserAdministrationObservable(ko);
}