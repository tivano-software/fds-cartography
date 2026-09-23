
export function timeout(time: number): Promise<void> {
    return new Promise((resolve, reject) => setTimeout(() => resolve(), time));
}