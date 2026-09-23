import { UsersApi } from "../../client";
import { API_CONFIG } from "../../conf/api.const";
import { role } from "../../util/role-management/role-engine";
import { registerComponents } from "../../util/view/register";

role.subscribe((role) => {
    const api = new UsersApi(API_CONFIG);
    api.getCurrentUser().then(user => {
        if (user.roles) {
            user.roles.forEach(userRole => {
                role.engine.giveUserAccessFor(userRole);
            });
        }
    }).catch(error => {
        window.location.assign("/");
    });
});

export { registerComponents, role };