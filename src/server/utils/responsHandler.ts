export const successResponse = <T>(responseData: T | {}, message = "Success") => {
    return {
        success: true,
        message,
        data: responseData as T,
    };
};

export const errorResponse = <T>(message = "Something went wrong", error = null) => {
    return {
        success: false,
        message,
        data: null,
        error
    };
};

// TODO ASAP : Use Every where this throwError and in frontend use onSuccess and onError instead of waiting for data in useEffect everytime
export const throwError = (message: string): never => {
    throw new Error(message);
};