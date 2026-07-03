/* eslint-disable react-refresh/only-export-components */
import * as React from "react";

type TargetDateState = {
    targetDate: Date;
    setTargetDate: (date: Date) => void;
    selectedGroupId: string | null;
    setSelectedGroupId: (id: string | null) => void;
};

export const TargetDateContext = React.createContext<TargetDateState | undefined>(undefined);

export default function TargetDateProvider({ children }: { children: React.ReactNode }) {
    const [targetDate, setTargetDate] = React.useState<Date>(new Date());
    const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);

    const value = React.useMemo(
        () => ({
            targetDate,
            setTargetDate,
            selectedGroupId,
            setSelectedGroupId,
        }), [targetDate, selectedGroupId]
    );

    return (
        <TargetDateContext.Provider value={value}>
            {children}
        </TargetDateContext.Provider>
    );
}

export function useTargetDate() {
    const context = React.useContext(TargetDateContext);
    if (!context) {
        throw new Error("useTargetDate must be used within a TargetDateProvider");
    }
    return context;
}
