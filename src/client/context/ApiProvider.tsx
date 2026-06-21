import React, { createContext } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";


interface ApiContextType {
    account: ReturnType<typeof useCurrentAccount> | null;

}

export const ApiContext = createContext<ApiContextType>({
    account: null,
});

export const ApiProvider = ({ children }: { children: React.ReactNode }) => {
    const account = useCurrentAccount();


    return (
        <ApiContext.Provider value={{
            account,
        }}>
            {children}
        </ApiContext.Provider>
    );
};
