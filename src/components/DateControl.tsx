import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { useTargetDate } from "@/providers/targetdate-provider";
import { useState } from "react";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

function formatDateString(date: Date) {
    return `${date.getDate().toString().padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

const isToday = (dateToCheck: Date) => {
    const today = new Date();
    return (
        dateToCheck.getDate() === today.getDate() &&
        dateToCheck.getMonth() === today.getMonth() &&
        dateToCheck.getFullYear() === today.getFullYear()
    );
};

export default function DateControl() {

    const { targetDate, setTargetDate } = useTargetDate();
    const [ isNextDisabled, setIsNextDisabled ] = useState(true);

    const handlePreviousDay = () => {
        const newDate = new Date(targetDate);
        newDate.setDate(newDate.getDate() - 1);
        setTargetDate(newDate);
        setIsNextDisabled(false);
    };

    const handleNextDay = () => {
        const newDate = new Date(targetDate);
        newDate.setDate(newDate.getDate() + 1)
        setTargetDate(newDate);
        if (isToday(newDate)) {
            setIsNextDisabled(true)
            return
        }
    }

    return <div className="relative z-10 flex justify-between items-center">
        <Button variant="ghost" className="[&_svg]:size-8!" onClick={handlePreviousDay}><ChevronLeft /></Button>
        <div className="font-mono uppercase text-xl">{formatDateString(targetDate)}</div>
        <Button variant="ghost" className="[&_svg]:size-8!" onClick={handleNextDay} disabled={isNextDisabled}><ChevronRight /></Button>
    </div>
}
