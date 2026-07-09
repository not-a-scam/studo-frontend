/* eslint-disable react-hooks/set-state-in-effect */
import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldGroup, FieldError } from "@/components/ui/field"
import { useBackend, useAuth } from "@/providers/backend-provider"
import { Pencil, Trash2, Plus, Loader2, Check, X } from "lucide-react"

// Types matching provider
import type { UserType, GroupType, BackendTask } from "@/providers/backend-provider"
import { Switch } from "./ui/switch"
import { Textarea } from "./ui/textarea"

interface ModalProps {
    open: boolean
    onClose: () => void
}

// ----------------------------------------------------
// 1. Edit Profile Modal
// ----------------------------------------------------
export function EditProfileModal({ open, onClose }: ModalProps) {
    const { currentUser } = useAuth()
    const { updateProfile } = useBackend()
    
    const [fullName, setFullName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [success, setSuccess] = React.useState(false)

    React.useEffect(() => {
        if (open && currentUser) {
            setFullName(currentUser.full_name || "")
            setEmail(currentUser.email)
            setPassword("")
            setError(null)
            setSuccess(false)
        }
    }, [open, currentUser])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const fields: { full_name?: string; email?: string; password?: string } = {
                full_name: fullName,
                email: email,
            }
            if (password) {
                fields.password = password
            }
            await updateProfile(fields)
            setSuccess(true)
            setTimeout(() => {
                onClose()
            }, 1000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-md bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your personal information below.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="profile-fullname">Full Name</FieldLabel>
                            <Input
                                id="profile-fullname"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="profile-email">Email Address</FieldLabel>
                            <Input
                                id="profile-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                required
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="profile-password">New Password (optional)</FieldLabel>
                            <Input
                                id="profile-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                                minLength={8}
                            />
                        </Field>
                    </FieldGroup>

                    {error && <FieldError>{error}</FieldError>}
                    {success && <div className="text-sm font-medium text-emerald-500">Profile updated successfully!</div>}

                    <DialogFooter className="mt-6 gap-3!">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="">
                            {loading ? <Loader2 className="animate-spin size-4" /> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ----------------------------------------------------
// 2. Manage Groups Modal
// ----------------------------------------------------
export function ManageGroupsModal({ open, onClose }: ModalProps) {
    const { fetchGroups, createGroup, updateGroup, deleteGroup } = useBackend()
    
    const [groups, setGroups] = React.useState<GroupType[]>([])
    const [newGroupName, setNewGroupName] = React.useState("")
    const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null)
    const [editingName, setEditingName] = React.useState("")
    
    const [loading, setLoading] = React.useState(false)
    const [actionLoading, setActionLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const loadGroups = React.useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchGroups()
            setGroups(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load groups")
        } finally {
            setLoading(false)
        }
    }, [fetchGroups])

    React.useEffect(() => {
        if (open) {
            loadGroups()
            setNewGroupName("")
            setEditingGroupId(null)
        }
    }, [open, loadGroups])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newGroupName.trim()) return
        
        setActionLoading(true)
        setError(null)
        try {
            await createGroup(newGroupName.trim())
            setNewGroupName("")
            await loadGroups()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create group")
        } finally {
            setActionLoading(false)
        }
    }

    const handleSaveEdit = async (groupId: string) => {
        if (!editingName.trim()) return
        
        setActionLoading(true)
        setError(null)
        try {
            await updateGroup(groupId, editingName.trim())
            setEditingGroupId(null)
            await loadGroups()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update group")
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = async (groupId: string) => {
        if (!confirm("Are you sure you want to delete this group? All users in it will be unassigned.")) return
        
        setActionLoading(true)
        setError(null)
        try {
            await deleteGroup(groupId)
            await loadGroups()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete group")
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-lg bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle>Manage Groups</DialogTitle>
                    <DialogDescription>Create, edit, or delete groups.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate} className="flex gap-2 my-2">
                    <Input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="New group name (e.g. Beta Team)"
                        disabled={actionLoading}
                        required
                    />
                    <Button type="submit" disabled={actionLoading || !newGroupName.trim()}>
                        {actionLoading ? <Loader2 className="animate-spin size-4" /> : <Plus className="size-4 mr-1" />}
                        Create
                    </Button>
                </form>

                {error && <FieldError className="mb-2">{error}</FieldError>}

                <div className="max-h-60 overflow-y-auto border rounded-md divide-y mt-2">
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="animate-spin size-6 text-muted-foreground" /></div>
                    ) : groups.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">No groups created yet.</div>
                    ) : (
                        groups.map((group) => (
                            <div key={group.id} className="p-3 flex items-center justify-between gap-4">
                                {editingGroupId === group.id ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <Input
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="h-8"
                                            disabled={actionLoading}
                                            autoFocus
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSaveEdit(group.id)}
                                            disabled={actionLoading || !editingName.trim()}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Check className="size-4 text-emerald-500" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingGroupId(null)}
                                            disabled={actionLoading}
                                            className="h-8 w-8 p-0"
                                        >
                                            <X className="size-4 text-destructive" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-medium text-sm">{group.name}</span>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setEditingGroupId(group.id)
                                                    setEditingName(group.name)
                                                }}
                                                disabled={actionLoading}
                                                className="h-8 w-8 p-0 cursor-pointer"
                                            >
                                                <Pencil className="size-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(group.id)}
                                                disabled={actionLoading}
                                                className="h-8 w-8 p-0 cursor-pointer text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ----------------------------------------------------
// 3. Manage Users Modal
// ----------------------------------------------------
export function ManageUsersModal({ open, onClose }: ModalProps) {
    const { fetchAllUsers, fetchGroups, updateUser, deleteUser } = useBackend()
    
    const [users, setUsers] = React.useState<UserType[]>([])
    const [groups, setGroups] = React.useState<GroupType[]>([])
    
    const [editingUserId, setEditingUserId] = React.useState<string | null>(null)
    
    // User Edit Form fields
    const [fullName, setFullName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [role, setRole] = React.useState("user")
    const [groupId, setGroupId] = React.useState<string>("none")
    const [disabled, setDisabled] = React.useState(false)

    const [loading, setLoading] = React.useState(false)
    const [actionLoading, setActionLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")

    const loadData = React.useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [usersData, groupsData] = await Promise.all([
                fetchAllUsers(),
                fetchGroups()
            ])
            setUsers(usersData)
            setGroups(groupsData)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data")
        } finally {
            setLoading(false)
        }
    }, [fetchAllUsers, fetchGroups])

    React.useEffect(() => {
        if (open) {
            loadData()
            setEditingUserId(null)
            setSearchQuery("")
        }
    }, [open, loadData])

    const filteredUsers = React.useMemo(() => {
        if (!searchQuery.trim()) return users
        const query = searchQuery.toLowerCase().trim()
        return users.filter((u) => {
            const nameMatch = (u.full_name || "").toLowerCase().includes(query)
            const emailMatch = u.email.toLowerCase().includes(query)
            return nameMatch || emailMatch
        })
    }, [users, searchQuery])

    const startEditing = (user: UserType) => {
        setEditingUserId(user.id)
        setFullName(user.full_name || "")
        setEmail(user.email)
        setPassword("")
        setRole(user.role)
        setGroupId(user.group_id || "none")
        setDisabled(user.disabled)
        setError(null)
    }

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUserId) return

        setActionLoading(true)
        setError(null)
        try {
            const fields: {
                full_name?: string
                email?: string
                password?: string
                role?: string
                group_id?: string | null
                disabled?: boolean
            } = {
                full_name: fullName,
                email: email,
                role: role,
                group_id: groupId === "none" ? null : groupId,
                disabled: disabled
            }
            if (password) {
                fields.password = password
            }
            await updateUser(editingUserId, fields)
            setEditingUserId(null)
            await loadData()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update user")
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? All their task completions and comments will be deleted permanently.")) return
        
        setActionLoading(true)
        setError(null)
        try {
            await deleteUser(userId)
            await loadData()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete user")
        } finally {
            setActionLoading(false)
        }
    }

    const getGroupName = (id: string | null) => {
        if (!id) return "No Group"
        const group = groups.find((g) => g.id === id)
        return group ? group.name : "Unknown Group"
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-2xl bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle>Manage Users</DialogTitle>
                    <DialogDescription>Update roles, groups, status, or delete users.</DialogDescription>
                </DialogHeader>

                {error && <FieldError className="mb-2">{error}</FieldError>}

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Left: User list & search bar */}
                    <div className="md:col-span-3 flex flex-col gap-2">
                        <Input
                            placeholder="Search users by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9"
                        />
                        <div className="border rounded-md max-h-80 overflow-y-auto divide-y">
                            {loading ? (
                                <div className="p-8 flex justify-center"><Loader2 className="animate-spin size-6 text-muted-foreground" /></div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">No users found.</div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div key={user.id} className={`p-3 flex items-center justify-between text-sm gap-2 ${editingUserId === user.id ? "bg-accent" : ""}`}>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold truncate">{user.full_name || "Unnamed"}</span>
                                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                                            <span className="text-[10px] bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 mt-1 w-fit">
                                                {user.role.toUpperCase()} • {getGroupName(user.group_id)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => startEditing(user)}
                                                disabled={actionLoading}
                                                className="h-8 w-8 p-0 cursor-pointer"
                                            >
                                                <Pencil className="size-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={actionLoading}
                                                className="h-8 w-8 p-0 cursor-pointer text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Edit form */}
                    <div className="md:col-span-2 border rounded-md p-4 bg-muted/30">
                        {editingUserId ? (
                            <form onSubmit={handleSaveUser} className="space-y-3">
                                <h4 className="font-semibold text-sm border-b pb-1">Edit User Profile</h4>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold block">Full Name</label>
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="h-8 text-xs"
                                        disabled={actionLoading}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold block">Email</label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-8 text-xs"
                                        disabled={actionLoading}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold block">Password (optional)</label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-8 text-xs"
                                        placeholder="Enter to change password"
                                        disabled={actionLoading}
                                        minLength={8}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold block">Role</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full text-xs rounded-md border border-input bg-card p-1.5 h-8 focus:outline-hidden focus:ring-1 focus:ring-ring"
                                        disabled={actionLoading}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold block">Group</label>
                                    <select
                                        value={groupId}
                                        onChange={(e) => setGroupId(e.target.value)}
                                        className="w-full text-xs rounded-md border border-input bg-card p-1.5 h-8 focus:outline-hidden focus:ring-1 focus:ring-ring"
                                        disabled={actionLoading}
                                    >
                                        <option value="none">No Group</option>
                                        {groups.map((g) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 py-1">
                                    <input
                                        type="checkbox"
                                        id="edit-user-disabled"
                                        checked={disabled}
                                        onChange={(e) => setDisabled(e.target.checked)}
                                        disabled={actionLoading}
                                        className="rounded border-input text-primary focus:ring-primary size-4"
                                    />
                                    <label htmlFor="edit-user-disabled" className="text-xs font-medium cursor-pointer selection:bg-transparent">
                                        Account Disabled
                                    </label>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingUserId(null)}
                                        disabled={actionLoading}
                                        className="h-8 text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={actionLoading}
                                        className="h-8 text-xs"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin size-3" /> : "Save"}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-muted-foreground min-h-75">
                                Select a user from the list to edit their details.
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ----------------------------------------------------
// 4. Create/Edit Tasks Modal
// ----------------------------------------------------
export function CreateEditTasksModal({ open, onClose }: ModalProps) {
    const { fetchTasks, createTask, updateTask, deleteTask } = useBackend()
    
    // We can allow picking target date, default to today's local date
    const [targetDateStr, setTargetDateStr] = React.useState(() => {
        const d = new Date()
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    })

    const [tasks, setTasks] = React.useState<BackendTask[]>([])
    const [editingTaskId, setEditingTaskId] = React.useState<number | null>(null)
    
    // Form fields
    const [title, setTitle] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [externalUrl, setExternalUrl] = React.useState("")
    
    const [loading, setLoading] = React.useState(false)
    const [actionLoading, setActionLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const [isMultiTaskAdding, setIsMultiTaskAdding] = React.useState(false)
    const [startDateStr, setStartDateStr] = React.useState(() => {
        const d = new Date()
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    })
    const [multiTaskText, setMultiTaskText] = React.useState("")

    const loadTasks = React.useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const dateObj = new Date(targetDateStr + "T00:00:00")
            const data = await fetchTasks(dateObj)
            setTasks(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load tasks")
        } finally {
            setLoading(false)
        }
    }, [fetchTasks, targetDateStr])

    React.useEffect(() => {
        if (open) {
            loadTasks()
            setEditingTaskId(null)
            setTitle("")
            setDescription("")
            setExternalUrl("")
            setMultiTaskText("")
            setIsMultiTaskAdding(false)
            const d = new Date()
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, "0")
            const day = String(d.getDate()).padStart(2, "0")
            setStartDateStr(`${year}-${month}-${day}`)
        }
    }, [open, loadTasks])

    // Reload tasks when target date changes
    React.useEffect(() => {
        if (open) {
            loadTasks()
            setEditingTaskId(null)
        }
    }, [targetDateStr, open, loadTasks])

    const startEditing = (task: BackendTask) => {
        setEditingTaskId(task.id)
        setTitle(task.title)
        setDescription(task.description || "")
        setExternalUrl(task.external_url || "")
        setError(null)
    }

    const startCreating = () => {
        setEditingTaskId(null)
        setTitle("")
        setDescription("")
        setExternalUrl("")
        setError(null)
    }

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setActionLoading(true)
        setError(null)
        try {
            const payload = {
                title: title.trim(),
                description: description.trim() || null,
                external_url: externalUrl.trim() || null,
                target_date: targetDateStr
            }

            if (editingTaskId !== null) {
                await updateTask(editingTaskId, payload)
                setEditingTaskId(null)
            } else {
                await createTask(payload)
            }
            
            setTitle("")
            setDescription("")
            setExternalUrl("")
            await loadTasks()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save task")
        } finally {
            setActionLoading(false)
        }
    }

    const handleMultiTaskAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!multiTaskText.trim()) return

        setActionLoading(true)
        setError(null)
        try {
            const lines = multiTaskText.split(/\r?\n/)
            const tasksToAdd = []
            const currentDate = new Date(startDateStr + "T00:00:00")

            for (const line of lines) {
                if (!line.trim()) continue
                const parts = line.split(",")
                const parsedTitle = parts[0]?.trim() || ""
                if (!parsedTitle) continue

                let parsedDesc: string | null = null
                let parsedUrl: string | null = null

                if (parts.length === 2) {
                    parsedDesc = parts[1]?.trim() || null
                } else if (parts.length >= 3) {
                    parsedDesc = parts[1]?.trim() || null
                    parsedUrl = parts[2]?.trim() || null
                }

                const year = currentDate.getFullYear()
                const month = String(currentDate.getMonth() + 1).padStart(2, "0")
                const day = String(currentDate.getDate()).padStart(2, "0")
                const dateStr = `${year}-${month}-${day}`

                tasksToAdd.push({
                    title: parsedTitle,
                    description: parsedDesc,
                    external_url: parsedUrl,
                    target_date: dateStr,
                })

                currentDate.setDate(currentDate.getDate() + 1)
            }

            for (const task of tasksToAdd) {
                await createTask(task)
            }

            setMultiTaskText("")
            setIsMultiTaskAdding(false)
            if (targetDateStr === startDateStr) {
                await loadTasks()
            } else {
                setTargetDateStr(startDateStr)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add tasks")
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm("Are you sure you want to delete this task? All user completions for it will also be deleted.")) return
        
        setActionLoading(true)
        setError(null)
        try {
            await deleteTask(taskId)
            if (editingTaskId === taskId) {
                setEditingTaskId(null)
            }
            await loadTasks()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete task")
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-3xl bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle>Manage Tasks</DialogTitle>
                    <DialogDescription>Create, modify, or delete tasks for any date.</DialogDescription>
                </DialogHeader>
                <Field orientation="horizontal" className="items-center">
                    <FieldLabel className="text-xs font-semibold shrink-0">Multi-Task Adding</FieldLabel>
                    <Switch
                        checked={isMultiTaskAdding}
                        onCheckedChange={setIsMultiTaskAdding}
                    />
                </Field>

                {isMultiTaskAdding && (
                    <form onSubmit={handleMultiTaskAdd} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Add multiple tasks at once by entering them in the text area below.
                        </p>

                        <div className="flex items-center gap-4 my-2">
                            <label className="text-xs font-semibold shrink-0">Start Date:</label>
                            <Input
                                type="date"
                                value={startDateStr}
                                onChange={(e) => setStartDateStr(e.target.value)}
                                className="h-8 max-w-50"
                                disabled={actionLoading}
                                required
                            />
                        </div>

                        <Textarea
                            placeholder="Enter tasks separated by new lines...&#10;e.g.&#10;Task Title 1&#10;Task Title 2,Task Description 2&#10;Task Title 3,,https://example.com&#10;Task Title 4,Task Description 4,https://example.com"
                            className="min-h-36 text-sm"
                            value={multiTaskText}
                            onChange={(e) => setMultiTaskText(e.target.value)}
                            disabled={actionLoading}
                            required
                        />

                        {error && <FieldError className="mb-2">{error}</FieldError>}

                        <Button className="w-full" type="submit" disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="animate-spin size-4" /> : "Add Tasks"}
                        </Button>
                    </form>
                )}

                {!isMultiTaskAdding && (
                    <div>
                        <div className="flex items-center gap-4 my-2">
                            <label className="text-xs font-semibold shrink-0">Select Target Date:</label>
                            <Input
                                type="date"
                                value={targetDateStr}
                            onChange={(e) => setTargetDateStr(e.target.value)}
                            className="h-8 max-w-50"
                            disabled={actionLoading}
                        />
                        {editingTaskId !== null && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={startCreating}
                                disabled={actionLoading}
                                className="h-8 ml-auto text-xs"
                            >
                                Add New Task instead
                            </Button>
                        )}
                    </div>
                    {error && <FieldError className="mb-2">{error}</FieldError>}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Left: Tasks List */}
                        <div className="md:col-span-3 border rounded-md max-h-96 overflow-y-auto divide-y">
                            {loading ? (
                                <div className="p-8 flex justify-center"><Loader2 className="animate-spin size-6 text-muted-foreground" /></div>
                            ) : tasks.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">No tasks scheduled for this day.</div>
                            ) : (
                                tasks.map((task) => (
                                    <div key={task.id} className={`p-3 flex items-center justify-between text-sm gap-2 ${editingTaskId === task.id ? "bg-accent" : ""}`}>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold truncate">{task.title}</span>
                                            {task.description && <span className="text-xs text-muted-foreground truncate">{task.description}</span>}
                                            {task.external_url && (
                                                <a href={task.external_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline truncate">
                                                    {task.external_url}
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => startEditing(task)}
                                                disabled={actionLoading}
                                                className="h-8 w-8 p-0 cursor-pointer"
                                            >
                                                <Pencil className="size-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteTask(task.id)}
                                                disabled={actionLoading}
                                                className="h-8 w-8 p-0 cursor-pointer text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Right: Form (Create or Edit) */}
                        <div className="md:col-span-2 border rounded-md p-4 bg-muted/30">
                            <form onSubmit={handleSaveTask} className="space-y-3">
                                <h4 className="font-semibold text-sm border-b pb-1">
                                    {editingTaskId !== null ? "Edit Task" : "Create New Task"}
                                </h4>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold block">Task Title</label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter title (e.g. Daily Reflection)"
                                        className="h-8 text-xs"
                                        disabled={actionLoading}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold block">Description</label>
                                    <Input
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Optional description"
                                        className="h-8 text-xs"
                                        disabled={actionLoading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold block">Link URL</label>
                                    <Input
                                        type="url"
                                        value={externalUrl}
                                        onChange={(e) => setExternalUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="h-8 text-xs"
                                        disabled={actionLoading}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    {editingTaskId !== null && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={startCreating}
                                            disabled={actionLoading}
                                            className="h-8 text-xs"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={actionLoading}
                                        className="h-8 text-xs"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin size-3" /> : (editingTaskId !== null ? "Save" : "Create")}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
