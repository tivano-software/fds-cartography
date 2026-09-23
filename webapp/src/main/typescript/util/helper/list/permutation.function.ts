export function permutations<A>(inputArr: A[]): A[][] {
    const result: A[][] = [];
    const permute = (arr: A[], m: A[] = []): void => {
        if (arr.length === 0) {
            result.push(m)
        } else {
            for (let i = 0; i < arr.length; i++) {
                const curr = arr.slice();
                const next = curr.splice(i, 1);
                permute(curr.slice(), m.concat(next))
            }
        }
    }
    permute(inputArr)
    return result;
}