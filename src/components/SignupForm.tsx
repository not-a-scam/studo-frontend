import * as React from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
    FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { useAuth, useBackend } from "@/providers/backend-provider"

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { signup, isAuthenticated } = useAuth()
    const { apiBaseUrl } = useBackend()
    const navigate = useNavigate()

    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [groups, setGroups] = React.useState<string[]>([])
    const [group, setGroup] = React.useState<string>("")
    const [error, setError] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await fetch(`${apiBaseUrl}/auth/groups`)
                if (res.ok) {
                    const data = await res.json() as { id: string; name: string }[]
                    setGroups(data.map(g => g.name))
                }
            } catch (e) {
                console.error("Failed to fetch groups:", e)
            }
        }
        fetchGroups()
    }, [apiBaseUrl])

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate("/")
        }
    }, [isAuthenticated, navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            await signup(name, email, password, group || undefined)
            navigate("/login")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Sign up for an account</CardTitle>
                    <CardDescription>
                        Enter your details below to signup for an account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Name</FieldLabel>
                                <Input 
                                    id="name" 
                                    type="text" 
                                    placeholder="Stuart Loh" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required 
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="group">Cell Group</FieldLabel>
                                <Combobox 
                                    value={group} 
                                    onValueChange={(val) => setGroup(val || "")} 
                                    items={groups}
                                >
                                    <ComboboxInput placeholder="Select a cell group" required/>
                                    <ComboboxContent>
                                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(item) => (
                                                <ComboboxItem key={item} value={item}>
                                                    {item}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </Field>
                            {error && (
                                <Field>
                                    <FieldError>{error}</FieldError>
                                </Field>
                            )}
                            <Field>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Signing up..." : "Sign Up"}
                                </Button>
                                <FieldDescription className="text-center">
                                    Already have an account? <a href="/login">Login</a>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
