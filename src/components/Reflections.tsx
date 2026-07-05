import * as React from "react"
import { useTargetDate } from "@/providers/targetdate-provider"
import { useBackend, useAuth } from "@/providers/backend-provider"
import type { CommentType, GroupType, UserType } from "@/providers/backend-provider"
import { Button } from "./ui/button"
import { Users } from "lucide-react"
import { Card, CardHeader, CardContent } from "./ui/card"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./ui/context-menu"
import { Textarea } from "./ui/textarea"
import { Spinner } from "./ui/spinner"
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover"
import { cn } from "@/lib/utils"

interface CommentProps {
    comment: CommentType
    currentUser: UserType | null
    onEdit: (commentId: number, content: string) => Promise<void>
    onDelete: (commentId: number) => Promise<void>
}

const Comment = React.memo(function Comment({ comment, currentUser, onEdit, onDelete }: CommentProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [editContent, setEditContent] = React.useState(comment.content)
    const [isSaving, setIsSaving] = React.useState(false)

    const canManage = currentUser?.role === "admin" || currentUser?.id === comment.user_id

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(comment.content)
        } catch (err) {
            console.error("Failed to copy reflection:", err)
        }
    }

    const handleSave = async () => {
        if (!editContent.trim()) return
        setIsSaving(true)
        try {
            await onEdit(comment.id, editContent)
            setIsEditing(false)
        } catch (err) {
            console.error("Failed to save reflection:", err)
        } finally {
            setIsSaving(false)
        }
    }

    const formattedTime = React.useMemo(() => {
        try {
            return new Date(comment.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch (e) {
            console.error(e)
            return ""
        }
    }, [comment.created_at])

    const userName = comment.user?.full_name || comment.user?.email || "User"

    if (isEditing) {
        return (
            <Card size="sm" className="bg-accent w-full py-3">
                <CardHeader className=" text-xs flex items-center justify-between px-5 pb-2">
                    <span className="uppercase font-mono font-semibold text-muted-foreground">Editing Reflection</span>
                </CardHeader>
                <CardContent className="bg-card px-5 py-4 flex flex-col gap-3">
                    <Textarea
                        className="text-sm"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        disabled={isSaving}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => {
                                setIsEditing(false)
                                setEditContent(comment.content)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={isSaving || !editContent.trim()}
                            onClick={handleSave}
                        >
                            {isSaving ? <Spinner className="mr-1" /> : null}
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Card size="sm" className="bg-accent w-full py-3">
                    <CardHeader className="-mb-(--card-spacing) text-xs flex items-center justify-between px-5 pb-2">
                        <span className="uppercase font-mono font-semibold text-foreground">{userName}</span>
                        <span className="font-mono text-muted-foreground">{formattedTime}</span>
                    </CardHeader>
                    <CardContent className="bg-card -mb-(--card-spacing) px-0">
                        <p className="text-sm px-5 pt-4 pb-6 whitespace-pre-wrap">
                            {comment.content}
                        </p>
                    </CardContent>
                </Card>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={handleCopy}>Copy</ContextMenuItem>
                {canManage && (
                    <>
                        <ContextMenuItem onClick={() => setIsEditing(true)}>Edit</ContextMenuItem>
                        <ContextMenuItem
                            variant="destructive"
                            onClick={async () => {
                                if (confirm("Are you sure you want to delete this reflection?")) {
                                    await onDelete(comment.id)
                                }
                            }}
                        >
                            Delete
                        </ContextMenuItem>
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>
    )
})

export default function Reflections() {
    const { targetDate, selectedGroupId, setSelectedGroupId } = useTargetDate()
    const { currentUser } = useAuth()
    const { fetchComments, createComment, updateComment, deleteComment, fetchGroups } = useBackend()

    const [comments, setComments] = React.useState<CommentType[]>([])
    const [groups, setGroups] = React.useState<GroupType[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const [newReflection, setNewReflection] = React.useState("")
    const [isPosting, setIsPosting] = React.useState(false)

    const refreshComments = React.useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await fetchComments(targetDate, selectedGroupId)
            setComments(data)
        } catch (err) {
            console.error("Failed to fetch reflections:", err)
            setError("Failed to fetch reflections")
        } finally {
            setIsLoading(false)
        }
    }, [targetDate, selectedGroupId, fetchComments])

    React.useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void refreshComments()
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [refreshComments])

    React.useEffect(() => {
        fetchGroups()
            .then((data) => setGroups(data))
            .catch((err) => console.error("Failed to fetch groups:", err))
    }, [fetchGroups])

    // Find user's active/selected/defaulted group
    const activeGroupInfo = React.useMemo(() => {
        if (groups.length === 0) return { id: null, name: "No Group", isDefaulted: false }

        if (selectedGroupId) {
            const matched = groups.find((g) => g.id === selectedGroupId)
            if (matched) {
                return { id: matched.id, name: matched.name, isDefaulted: false }
            }
        }

        if (currentUser?.group_id) {
            const matched = groups.find((g) => g.id === currentUser.group_id)
            if (matched) {
                return { id: matched.id, name: matched.name, isDefaulted: false }
            }
        }

        // Default to the first group
        const defaultGroup = groups[0]
        return { id: defaultGroup.id, name: defaultGroup.name, isDefaulted: true }
    }, [groups, currentUser, selectedGroupId])

    const handlePost = React.useCallback(async () => {
        if (!newReflection.trim()) return
        setIsPosting(true)
        try {
            await createComment(newReflection, activeGroupInfo.id)
            setNewReflection("")
            await refreshComments()
        } catch (err) {
            console.error("Failed to post reflection:", err)
            setError("Failed to post reflection")
        } finally {
            setIsPosting(false)
        }
    }, [newReflection, createComment, activeGroupInfo.id, refreshComments])

    const handleEditComment = React.useCallback(async (commentId: number, content: string) => {
        await updateComment(commentId, content)
        await refreshComments()
    }, [updateComment, refreshComments])

    const handleDeleteComment = React.useCallback(async (commentId: number) => {
        await deleteComment(commentId)
        await refreshComments()
    }, [deleteComment, refreshComments])

    return (
        <div className="mt-4 flex flex-col gap-3">
            {/* Reflections header */}
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h2 className="font-mono uppercase text-xl">Reflections</h2>
                </div>
                {currentUser?.role === "admin" ? (
                    <Popover>
                        <PopoverTrigger className="rounded-lg bg-input py-1.5 px-4 flex items-center gap-2 text-sm font-mono uppercase text-foreground cursor-pointer hover:bg-input/80 transition-colors">
                            <Users size={18} />
                            <span>{activeGroupInfo.name}</span>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-1 bg-popover">
                            <div className="flex flex-col gap-1">
                                <div className="px-2 py-1 text-xs text-muted-foreground font-mono uppercase">
                                    Select Group
                                </div>
                                {groups.map((g) => (
                                    <Button
                                        key={g.id}
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start font-mono text-xs py-1.5 px-2",
                                            activeGroupInfo.id === g.id && "bg-accent text-accent-foreground"
                                        )}
                                        onClick={() => {
                                            setSelectedGroupId(g.id)
                                        }}
                                    >
                                        {g.name}
                                    </Button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <div className="rounded-lg bg-input py-1.5 px-4 flex items-center gap-2 text-sm font-mono uppercase text-foreground">
                        <Users size={18} />
                        <span>{activeGroupInfo.name}</span>
                    </div>
                )}
            </div>

            {/* Input to create a new comment */}
            <div className="flex flex-col gap-2">
                <Textarea
                    className="text-sm"
                    placeholder="Type your reflection here..."
                    value={newReflection}
                    onChange={(e) => setNewReflection(e.target.value)}
                    disabled={isPosting}
                />
                <Button
                    className="text-sm p-1!"
                    onClick={handlePost}
                    disabled={isPosting || !newReflection.trim()}
                >
                    {isPosting ? <Spinner className="mr-1" /> : null}
                    Post Reflection
                </Button>
            </div>

            {/* Reflections list */}
            <div className="flex flex-col gap-2 mt-4">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Spinner className="size-6 text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-sm text-destructive font-mono uppercase">
                        {error}
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground font-mono uppercase">
                        No reflections posted for this day.
                    </div>
                ) : (
                    comments.map((comment) => (
                        <Comment
                            key={comment.id}
                            comment={comment}
                            currentUser={currentUser}
                            onEdit={handleEditComment}
                            onDelete={handleDeleteComment}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
