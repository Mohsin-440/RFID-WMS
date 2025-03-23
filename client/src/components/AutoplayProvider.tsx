"use client";

import { createContext, useContext, useState } from 'react';

type AutoplayContextType = {
    autoplayOn: boolean;
    setAutoplayOn: (value: boolean) => void;
};

const AutoplayContext = createContext<AutoplayContextType | undefined>(undefined);

export function AutoplayProvider({ children }: { children: React.ReactNode }) {
    const [autoplayOn, setAutoplayOn] = useState(false)

    return (
        <>
           
            <AutoplayContext.Provider value={{ autoplayOn, setAutoplayOn }}>
                {children}
            </AutoplayContext.Provider>
        </>
    );
}

export function useAutoplay() {
    const context = useContext(AutoplayContext);
    if (context === undefined) {
        throw new Error('useAutoplay must be used within an AutoplayProvider');
    }
    return context;
}