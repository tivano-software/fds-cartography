import { Knockout, WriteComputed } from "./lib/knockout.interface";


export function mapObservable<A>(ko: Knockout, data: A, owner: any, mapper: {
    write?: (val: A) => A,
    read?: (val: A) => A
} = {}): WriteComputed<A> {
    const write = mapper.write ?? ((val: A) => val);
    const read = mapper.read ?? ((val: A) => val);
    const obs = ko.observable(data);
    const com: WriteComputed<A> = ko.computed<A>({
        write: (val: A) => {
            return obs(write(val));
        },
        read: () => {
            return read(obs());
        },
        owner
    });
    return com;
}