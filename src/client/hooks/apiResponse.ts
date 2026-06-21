export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export function typedMutationFn<TData, TArgs = any>(
    mutationConfig: { mutationFn: (args: TArgs) => Promise<any> }
) {
    return mutationConfig.mutationFn as (args: TArgs) => Promise<ApiResponse<TData>>;
}

export function typedQueryFn<TData>(
    queryConfig: { queryFn: (context: any) => Promise<any> }
) {
    return queryConfig.queryFn as (context: any) => Promise<ApiResponse<TData>>;
}