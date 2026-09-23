import { Knockout } from "../../knockout";
import { RoleEngine } from "./role-engine";
import { Roles } from "./roles";

export interface RoleHandler {
    engine: RoleEngine;
    enum: typeof Roles;
    subscribe(func: (role: RoleHandler) => void): void;
    init(ko: Knockout): void;
}

const subscriptions: ((role: RoleHandler) => void)[] = [];
const role: RoleHandler = {
    engine: undefined as unknown as RoleEngine,
    enum: Roles,
    subscribe: (func: (role: RoleHandler) => void) => {
        subscriptions.push(func);
    },
    init: (ko) => {
        role.engine = new RoleEngine(ko);
        subscriptions.forEach(func => {
            func(role);
        });
    }
};

export { role };