
export interface Metadata {
    location: string,
    absolute?: number,
    relativ?: number,
    entries: { token: string, absolute?: number, relativ?: number, distance?: number }[]
}