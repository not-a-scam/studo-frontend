import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/providers/backend-provider"
import DateControl from "@/components/DateControl";
import Header from "@/components/Header";
import Reflections from "@/components/Reflections";
import Todo from "@/components/Todo";
import { Separator } from "@/components/ui/separator";

 export default function HomePage() {
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    React.useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login")
        }
    }, [isAuthenticated, navigate])

    if (!isAuthenticated) {
        return null
    }

    return(
        <div className="flex min-h-svh flex-col">
            <Header />

            {/* Body */}
            <div className="flex flex-col py-5 px-6">
                <DateControl />
                <Todo />
                <Separator className="mt-5" />
                <Reflections />
            </div>
        </div>
    )
 }
 
