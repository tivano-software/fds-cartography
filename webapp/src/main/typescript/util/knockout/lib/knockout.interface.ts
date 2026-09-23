import { Comporator } from "../../types";
import { Undefindable } from "../../types";

interface Subscribable<A> {
	subscribe: (callback: (changed: A) => void) => void;
	(): A;
}

interface ObservableNotNull<A> extends Subscribable<A> {
	(newValue: A): void;
	(): A;
	subscribe: (callback: (newValue: A) => void, context?: null, time?: "beforeChange") => void;
	extend(param: { notify: 'always' }): void;
}

type Observable<A> = ObservableNotNull<Undefindable<A>>;

type ToObservableNotNull<O> = O extends Observable<infer A>
	? ObservableNotNull<A>
	: never;

function toObservableNotNull<O>(o: Observable<O>): ObservableNotNull<O> | null {
	const val = o();
	if (val == undefined) {
		return null;
	}
	return o as ObservableNotNull<O>;
}

type AttributesToObservableNotNull<A> = {
	[S in keyof A]: ToObservableNotNull<A[S]>;
}

interface ObservableArray<A> extends Subscribable<A[]> {
	(newValue: A[]): void;
	(): A[];
	remove: (value: A) => void;
	removeAll: () => void;
	push: (...value: A[]) => void;
	sorted(comporator: Comporator<A>): A[];
	indexOf(value: A): number;
	subscribe: (callback: (changedValues: A[]) => void, context?: null, time?: "beforeChange") => void;
}

interface ComputedNotNull<A> {
	(): A;
	subscribe: (callback: (newValue: A) => void, context?: null, time?: "beforeChange") => void;
}

interface WriteComputed<A> extends ComputedNotNull<A> {
	(val: A): void;
}

type Computed<A> = ComputedNotNull<Undefindable<A>>;

type WatchableNotNull<A> = Subscribable<A>;

interface Knockout {
	when(predicate: () => boolean, perform: () => void): void;
	observable: {
		<A>(value: undefined): Observable<A>;
		<A>(value: A): ObservableNotNull<A> & Observable<A>;
	};
	observableArray: {
		<A>(value: A[]): ObservableArray<A>;
	};
	computed: {
		<A>(value: {
			read: () => A,
			write: (val: A) => void,
			owner: any,
		}): WriteComputed<A>;
		<A>(value: undefined): WriteComputed<A>;
		<A>(func: () => Undefindable<A>): ComputedNotNull<A> & Computed<A>;
	};
	components: {
		register<Param, Model>(
			key: string,
			data: {
				viewModel: ((param: Param) => void) | ({
					createViewModel?: (param: Param, componentInfo: any) => Model
				});
				template: string | { require: string };
			}
		): void;
	};
}

export { Knockout, Observable, ObservableNotNull, ObservableArray, Computed, WriteComputed, ComputedNotNull, Subscribable, WatchableNotNull, AttributesToObservableNotNull, ToObservableNotNull, toObservableNotNull };
