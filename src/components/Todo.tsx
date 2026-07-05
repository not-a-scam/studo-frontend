import * as React from "react"
import { useTargetDate } from "@/providers/targetdate-provider"
import { Checkbox } from "./ui/checkbox"
import { ExternalLink, ChevronDown } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { FieldGroup, FieldTitle } from "./ui/field"
import { Button } from "./ui/button"
import { useTasks, useBackend, type BackendTask } from "@/providers/backend-provider"
import { Spinner } from "./ui/spinner"
import { cn } from "@/lib/utils"

interface TaskProps {
    id: number
    title: string
    description?: string
    external_url?: string
    is_completed: boolean
    onToggle: (taskId: number) => void
}

function Task(props: TaskProps) {
    const { selectedGroupId } = useTargetDate()
    const { fetchTaskCompletions } = useBackend()
    
    const [isExpanded, setIsExpanded] = React.useState(false)
    const [completions, setCompletions] = React.useState<{ id: string; full_name: string | null; email: string; completed: boolean }[]>([])
    const [isLoadingCompletions, setIsLoadingCompletions] = React.useState(false)
    const [completionError, setCompletionError] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!isExpanded) return

        let active = true
        const loadCompletions = async () => {
            setIsLoadingCompletions(true)
            setCompletionError(null)
            try {
                const data = await fetchTaskCompletions(props.id, selectedGroupId)
                if (active) {
                    setCompletions(data)
                }
            } catch (err) {
                console.error("Failed to fetch completions:", err)
                if (active) {
                    setCompletionError("Failed to load team progress")
                }
            } finally {
                if (active) {
                    setIsLoadingCompletions(false)
                }
            }
        }

        loadCompletions()
        return () => {
            active = false
        }
    }, [props.id, isExpanded, selectedGroupId, fetchTaskCompletions, props.is_completed])

    return (
        <Card 
            className="bg-card p-4 cursor-pointer hover:bg-muted/10 transition-colors select-none" 
            id={props.id.toString()}
            onClick={() => setIsExpanded(prev => !prev)}
        >
            <CardContent className="flex flex-col p-0 m-0">
                <div className="flex flex-row justify-between items-center w-full">
                    <FieldGroup className="flex flex-row-reverse justify-end items-center">
                        <FieldTitle>
                            <div className="flex flex-col gap-1 text-left">
                                <span>{props.title}</span>
                                {props.description && <span className="text-muted-foreground text-xs font-normal">{props.description}</span>}
                            </div>
                        </FieldTitle>
                        <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={props.is_completed} onCheckedChange={() => props.onToggle(props.id)} />
                        </div>
                    </FieldGroup>
                    <div className="flex items-center gap-2">
                        { props.external_url &&
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="p-0 h-min"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(props.external_url, "_blank", "noopener,noreferrer")
                                }}
                            >
                                <ExternalLink size={18} className="text-foreground" />
                            </Button>
                        }
                        <div className={cn(
                            "text-muted-foreground transition-transform duration-200",
                            isExpanded && "rotate-180"
                        )}>
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-4 border-t border-border pt-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono uppercase text-muted-foreground">Team Completion Status</span>
                            {isLoadingCompletions && <Spinner className="size-3.5" />}
                        </div>
                        
                        {completionError && (
                            <span className="text-xs text-destructive">{completionError}</span>
                        )}

                        {!isLoadingCompletions && !completionError && completions.length === 0 && (
                            <span className="text-xs text-muted-foreground font-mono">No group members found.</span>
                        )}

                        {!isLoadingCompletions && !completionError && completions.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                {completions.map((comp) => (
                                    <div key={comp.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-muted/30">
                                        {comp.completed ? (
                                            <div className="size-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500">
                                                <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="size-4 rounded-full border border-muted-foreground/30 flex items-center justify-center" />
                                        )}
                                        <span className={cn(
                                            "text-xs font-mono truncate",
                                            comp.completed ? "text-foreground font-medium" : "text-muted-foreground"
                                        )}>
                                            {comp.full_name || comp.email}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function Todo() {
    const { targetDate } = useTargetDate()
    const { tasks, isLoading, error, toggleTask } = useTasks(targetDate)

    const renderTask = (task: BackendTask) => (
        <Task
            key={task.id}
            id={task.id}
            title={task.title}
            description={task.description ?? undefined}
            external_url={task.external_url ?? undefined}
            is_completed={task.is_completed}
            onToggle={toggleTask}
        />
    )

    return <div className="flex flex-col mt-4 gap-2">
        {isLoading && <div className="text-sm text-muted-foreground">Loading tasks...</div>}
        {error && <div className="text-sm text-destructive">{error}</div>}
        {!isLoading && !error && tasks.map(renderTask)}
    </div>
}
