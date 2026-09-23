
export type LeavesMapperToObject<A, MappedLeaf> = {
    [S in keyof A]: ((value: MappedLeaf) => A[S])
}

export type LeavesMapperFromObject<A, MappedLeaf> = {
    [S in keyof A]: ((value: A[S]) => MappedLeaf)
}