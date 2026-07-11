import * as React from "react"
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { User } from "lucide-react"
import { FieldGroup } from "./ui/field"
import { useAuth } from "@/providers/backend-provider"
import {
    EditProfileModal,
    ManageGroupsModal,
    ManageUsersModal,
    CreateEditTasksModal,
} from "./ManageModals"
import { Switch } from "./ui/switch"
import { useTheme } from "@/providers/theme-provider"

export default function Header() {
    const { logout, currentUser } = useAuth()
    const { theme, setTheme } = useTheme()

    const [isProfileOpen, setIsProfileOpen] = React.useState(false)
    const [isGroupsOpen, setIsGroupsOpen] = React.useState(false)
    const [isUsersOpen, setIsUsersOpen] = React.useState(false)
    const [isTasksOpen, setIsTasksOpen] = React.useState(false)

    const isAdmin = currentUser?.role === "admin"

    const isDark =
        theme === "dark" ||
        (theme === "system" &&
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches)

    return (
        <div className="sticky top-0 w-full h-min flex justify-between bg-background px-6 py-4 z-50 border-b border-border/40">
            <h1 className="font-bold text-xs">Secondary<br />Grow Together</h1>

            <Popover>
                <PopoverTrigger>
                    <Avatar className="cursor-pointer">
                        <AvatarFallback>
                            <User />
                        </AvatarFallback>
                    </Avatar>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 py-2 mt-2 bg-accent shadow-lg border border-border">
                    <FieldGroup className="gap-1!">
                        <div className="px-2 py-1 mb-1 border-b border-border/60">
                            <p className="text-xs font-semibold truncate">{currentUser?.full_name || "Secondary Grow Together User"}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</p>
                        </div>
                        
                        <Button variant="ghost" onClick={() => setIsProfileOpen(true)} className="justify-start! w-full cursor-pointer h-8 text-xs font-medium">
                            Edit Profile
                        </Button>
                        
                        {isAdmin && (
                            <>
                                <Button variant="ghost" onClick={() => setIsGroupsOpen(true)} className="justify-start! w-full cursor-pointer h-8 text-xs font-medium">
                                    Manage Groups
                                </Button>
                                <Button variant="ghost" onClick={() => setIsUsersOpen(true)} className="justify-start! w-full cursor-pointer h-8 text-xs font-medium">
                                    Manage Users
                                </Button>
                                <Button variant="ghost" onClick={() => setIsTasksOpen(true)} className="justify-start! w-full cursor-pointer h-8 text-xs font-medium">
                                    Create/Edit Tasks
                                </Button>
                            </>
                        )}
                        <label htmlFor="theme" className="justify-start! flex items-center gap-3 pl-2.5 w-full cursor-pointer h-8 text-xs font-medium">
                            <Switch
                                id="theme"
                                checked={isDark}
                                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                            />
                            Dark mode
                        </label>

                        <Button variant="ghost" onClick={logout} className="justify-start! w-full cursor-pointer h-8 text-xs font-medium text-destructive hover:bg-destructive/10">
                            Logout
                        </Button>
                    </FieldGroup>
                </PopoverContent>
            </Popover>

            {/* Modals */}
            <EditProfileModal open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <ManageGroupsModal open={isGroupsOpen} onClose={() => setIsGroupsOpen(false)} />
            <ManageUsersModal open={isUsersOpen} onClose={() => setIsUsersOpen(false)} />
            <CreateEditTasksModal open={isTasksOpen} onClose={() => setIsTasksOpen(false)} />
        </div>
    )
}
