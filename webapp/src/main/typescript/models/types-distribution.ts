
export type Vector = Array<number>;

/**
 * Calculates the "distance" between two types distributions.
 *
 * Both distribution vectors must
 * 1.) have the same number of components,
 * 2.) only contain non-negative values as components and
 * 3.) be normalized (i.e. the sum of the squares of the components is 1)
 *
 * If those conditions are met, the returned value is between 0 (identical distributions)
 * and 1 (no common types in both distributions), and guaranteed to be a mathematical well defined distance.
 * Otherwise, if the first condition is not met, the functions returns undefined, and if the second or third
 * condition are not met, the returned number may be outside the results range of [0..1] and will
 * not be a well defined distance.
 *
 * At the moment, the types distribution distance is the square of the sine of the angle between a and b -
 * this may change later if another distance function turns out to be better suited to compare types distributions.
 *
 * @param a
 * @param b
 */
export function typesDistributionDistance(a: Vector | undefined, b: Vector | undefined): number | undefined {
    if (a === undefined || b === undefined || a.length != b.length) {
        return undefined
    }
    // we assume that a and b are normalized, which means a·b = cos(∠a,b) and
    // we can calculate sin²(∠a,b) as 1 - (a·b)²
    const a·b = a.reduce((result, a_i, i) => result + a_i * b[i], 0);
    return 1 - a·b*a·b;
}