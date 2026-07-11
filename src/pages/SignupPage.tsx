import { SignupForm } from "@/components/SignupForm";


export default function SignupPage() {
    return (
        <div className="flex min-h-svh flex-col justify-center gap-5 py-20 px-5">
            <h1 className="text-4xl font-black text-center">Secondary<br />Grow Together</h1>
            <SignupForm />
        </div>
    )
}
