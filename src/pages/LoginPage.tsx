import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
    return (
        <div className="flex min-h-svh flex-col justify-center gap-5 py-3 px-5">
            <h1 className="text-4xl font-black text-center">StuDo</h1>
            <LoginForm />
        </div>
    )
}
