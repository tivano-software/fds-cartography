
export interface Validator {
    validate(): boolean;
    error(): string[];
    clearErrors(): void;
}

export function dummyValidator(): Validator {
    return new DummyValidator();
}

export function sequentiellValidator(validators: (Validator | undefined)[]): Validator {
    return new SequentiellValidator(validators);
}

export function parallelValidator(validators: (Validator | undefined)[]): Validator {
    return new ParallelValidator(validators);
}

abstract class ChildValidator implements Validator {
    constructor(private validatorsList: (Validator | undefined)[]) {}

    abstract validate(): boolean;

    error(): string[] {
        const errors: string[] = [];
        this.validators.forEach(validator => {
            validator?.error().forEach(val => errors.push(val));
        });
        return errors;
    }

    get validators(): (Validator | undefined)[] {
        return this.validatorsList;
    }

    clearErrors(): void {
        this.validatorsList.forEach(validator => validator?.clearErrors());
    }
}

class SequentiellValidator extends ChildValidator {
    validate(): boolean {
        for (var key in this.validators) {
            const validator = this.validators[key];
            if (validator !== undefined) {
                const validatorIsValid = validator.validate();
                if (!validatorIsValid) {
                    return false;
                }
            }
        }
        return true;
    }
}

class ParallelValidator extends ChildValidator {
    validate(): boolean {
        var valid = true;
        this.validators.forEach(validator => {
            if (validator !== undefined) {
                const validatorIsValid = validator.validate();
                if (!validatorIsValid) {
                    valid = false;
                }
            }
        });
        return valid;
    }
}

class DummyValidator implements Validator {

    clearErrors(): void {}

    validate(): boolean {
        return true;
    }

    error(): string[] {
        return [];
    }
}