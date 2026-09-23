import { FileNameStringHTML } from "../../types/template-types/file-name-string.type";
import { LeavesMapperFromObject, LeavesMapperToObject } from "../../types/util-types/mapped-types/leaves-mapper.type";
import { URLHandleElement } from "./url-handle-element";


export enum ParamType {
    STRING,
    NUMBER,
    NULL
}

export class URLService {

    public updateURLParamsByObject<A extends object, Keys extends (keyof A)>(
        base: FileNameStringHTML,
        o: Pick<A, Keys>,
        leavesMapperToObject: LeavesMapperToObject<A, string | null | undefined>,
        leavesMapper: LeavesMapperFromObject<A, string>,
    ): void {
        const params = this.loadURLParamsByObject<A>(leavesMapperToObject);
        if (params === null) {
            return;
        }
        Object.assign(params, o);
        this.createURLParamsByObject<A>(params, leavesMapper).updateURL(base);
    }

    public createURLParamsByObject<A extends object>(
        o: A,
        leavesMapper: LeavesMapperFromObject<A, string>,
    ): URLHandleElement {
        const paramList: string[] = [];
        for (const key in o) {
            const val = o[key];
            if (val === null || val === undefined) {
                continue;
            }
            const valAsString = leavesMapper[key](val);
            const paramAsString = key.trim() + '=' + valAsString.trim();
            paramList.push(paramAsString);
        }
        return new URLHandleElement(paramList);
    }

    public loadURLParamsByObject<A extends object>(
        leavesMapper: LeavesMapperToObject<A, string | null | undefined>
    ): A | null {
        const result: any = {};
        for (const key in leavesMapper) {
            try {
                result[key] = leavesMapper[key](this.getString(key));
            } catch(exception) {
                return null;
            }
        }
        return result;
    }

    public isParamOfType(key: string, paramType: ParamType): boolean {
        if (!this.isParamGiven(key)) {
            return false;
        }
        switch(paramType) {
            case ParamType.NULL: return this.getString(key) === null;
            case ParamType.STRING: return this.getString(key) !== null;
            case ParamType.NUMBER: return this.getNumber(key) !== null;
        }
    }

    public isParamGiven(key: string): boolean {
        const val = this.getString(key);
        return val != null;
    }

    public getNumber(key: string): number | null {
        const val = this.getString(key);
        const valAsNumber = Number(val);
        if (isNaN(valAsNumber)) {
            return null;
        }
        return valAsNumber;
    }

    public getString(key: string): string | null {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(key);
    }

}