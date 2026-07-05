import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { BackendProvider } from "@/providers/backend-provider"
import { ThemeProvider } from "@/providers/theme-provider.tsx"
import TargetDateProvider from "./providers/targetdate-provider.tsx"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <BackendProvider>
                <TargetDateProvider>
                    <App />
                </TargetDateProvider>
            </BackendProvider>
        </ThemeProvider>
    </StrictMode>
)
