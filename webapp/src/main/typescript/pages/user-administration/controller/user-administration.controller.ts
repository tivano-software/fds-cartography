
import { UsersApi } from "../../../client/apis/UsersApi";
import { UserRolesEnum } from "../../../client/models/User";
import { UserAdministrationObservable } from "../observable/user-administration.observable";
import { UserObservable } from "../observable/user.observable";
import { GeneralController } from "../../../util/controller/controller.interface";
import { API_CONFIG } from "../../../conf/api.const";


class UserAdministrationController implements GeneralController {

    private readonly usersApi: UsersApi;
    private readonly userAdministration: UserAdministrationObservable;

    constructor(userAdministration: UserAdministrationObservable) {
        this.usersApi = new UsersApi(API_CONFIG);
        this.userAdministration = userAdministration;
    }

    public async deleteUser(user: UserObservable): Promise<void> {
        const okay = window.confirm("Der Eintrag wird endg\u00fcltig gel\u00f6scht. Sind Sie sicher?");
        if (okay) {
            const id = user.id();
        if (id === undefined) {
            throw new Error();
        }
        return await this.usersApi.deleteUser({ id })
            .then(success => {
                const msg = 'Der Nutzer mit der ID ' + id + ' wurde erfolgreich gel\u00f6scht.';
                this.userAdministration.getMessagingHandler().clearAll();
                this.userAdministration.getMessagingHandler().registerSuccess(msg).show();
                this.initUsers();
            })
            .catch(error => {
                const msg = 'Beim L\u00f6schen des Nutzers mit der ID ' + id + ' ist ein Fehler aufgetreten.';
                this.userAdministration.getMessagingHandler().clearAll();
                this.userAdministration.getMessagingHandler().registerError(msg).show();
                console.error(msg);
                console.error(error);

            });
        }
    }

    public async submitNewUser(): Promise<void> {
        var createUserWrapper = this.userAdministration.createUser;
        var rolesSet = new Set<UserRolesEnum>();
        createUserWrapper.roles().forEach(role => rolesSet.add(role));
        return await this.usersApi.createUser({
            user: {
                email: createUserWrapper.email(),
                roles: rolesSet
            }
        }).then(success => {
            this.initUsers();
            this.userAdministration.createUser.clear();
        }).catch(error => console.error(error));
    }

    public async init(): Promise<void> {
        await this.initUsers();
        this.userAdministration.init();
    }

    public async initUsers(): Promise<void> {
        this.userAdministration.clearUsers();
        return await this.usersApi.getAllUsers().then(users => {
            users.forEach(user => this.userAdministration.addExistingUser(user));
        }).catch(error => {
            console.error(error)
        });
    }
}

function userAdministrationControllerOf (model: UserAdministrationObservable): UserAdministrationController {
    return new UserAdministrationController(model);
}

export { userAdministrationControllerOf };