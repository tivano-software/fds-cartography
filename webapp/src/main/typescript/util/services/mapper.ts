import { ExistingUserRolesEnum } from "../../client/models/ExistingUser";
import { UserRolesEnum } from "../../client/models/User";

export function mapUserRolesEnum(existiungUserRole: ExistingUserRolesEnum): UserRolesEnum {
    switch(existiungUserRole) {
        case ExistingUserRolesEnum.ADMIN: return UserRolesEnum.ADMIN;
        case ExistingUserRolesEnum.USER: return UserRolesEnum.USER;
    }
}

const SEPERATOR = ';';
export function mapNumberListToString(list: number[]): string {
    return list.join(SEPERATOR);
}
export function mapStringToNumberList(list: string): number[] {
    return list.split(SEPERATOR).map(val => Number(val)).filter(val => !isNaN(val));
}

export function fromStringToEnum<
    EnumEntry extends {},
    EnumType extends {},
>(
    val:  undefined | null | (EnumEntry & string),
    object: EnumType,
): EnumEntry | null {
    if (!val) {
        return null;
    }
    for (const enumVal of Object.keys(object)) {
        if (enumVal === val) {
            return val;
        }
    }
    return null;
}