/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

type BackendTask = {
	id: number
	title: string
	description: string | null
	external_url: string | null
	target_date: string
	is_completed: boolean
}

type TaskToggleResult = {
	status: string
	task_id: number
}

export type UserType = {
	id: string
	email: string
	full_name: string | null
	role: string
	group_id: string | null
	created_at: string
	disabled: boolean
}

export type CommentType = {
	id: number
	content: string
	target_date: string
	user_id: string
	group_id: string
	created_at: string
	user: {
		email: string
		full_name: string | null
	} | null
}

export type GroupType = {
	id: string
	name: string
	created_at: string
}


type BackendState = {
	accessToken: string | null
	isAuthenticated: boolean
	currentUser: UserType | null
}

type BackendActions = {
	apiBaseUrl: string
	login: (email: string, password: string) => Promise<void>
	signup: (name: string, email: string, password: string, groupName?: string) => Promise<void>
	logout: () => Promise<void>
	fetchTasks: (targetDate: Date, signal?: AbortSignal) => Promise<BackendTask[]>
	fetchTaskCompletions: (taskId: number, groupId?: string | null) => Promise<{ id: string; full_name: string | null; email: string; completed: boolean }[]>
	toggleTaskCompletion: (taskId: number) => Promise<TaskToggleResult>
	fetchComments: (targetDate: Date, groupId?: string | null) => Promise<CommentType[]>
	createComment: (content: string, groupId?: string | null) => Promise<CommentType>
	updateComment: (commentId: number, content: string) => Promise<CommentType>
	deleteComment: (commentId: number) => Promise<CommentType>
	fetchGroups: () => Promise<GroupType[]>
	updateProfile: (fields: { full_name?: string; email?: string; password?: string }) => Promise<UserType>
	updateUser: (userId: string, fields: { full_name?: string; email?: string; password?: string; role?: string; group_id?: string | null; disabled?: boolean }) => Promise<UserType>
	deleteUser: (userId: string) => Promise<void>
	fetchAllUsers: () => Promise<UserType[]>
	updateGroup: (groupId: string, name: string) => Promise<GroupType>
	deleteGroup: (groupId: string) => Promise<void>
	createGroup: (name: string) => Promise<GroupType>
	createTask: (task: { title: string; description: string | null; external_url: string | null; target_date: string }) => Promise<BackendTask>
	updateTask: (taskId: number, task: { title: string; description: string | null; external_url: string | null; target_date: string }) => Promise<BackendTask>
	deleteTask: (taskId: number) => Promise<void>
}

export type BackendContextState = BackendState & BackendActions

const BackendStateContext = React.createContext<BackendState | undefined>(undefined)
const BackendActionsContext = React.createContext<BackendActions | undefined>(undefined)

const ACCESS_TOKEN_STORAGE_KEY = "access_token"
const DEFAULT_API_BASE_URL = "http://localhost:8080"

function formatTargetDate(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")

	return `${year}-${month}-${day}`
}

function getApiBaseUrl() {
	return import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL ?? DEFAULT_API_BASE_URL
}

async function readJsonResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		let message = `Request failed with status ${response.status}`
		try {
			const errorBody = await response.json()
			if (errorBody && typeof errorBody === "object" && "detail" in errorBody) {
				message = String(errorBody.detail)
			} else {
				message = JSON.stringify(errorBody)
			}
		} catch (e) {
            console.error(e)
			try {
				const text = await response.text()
				if (text) message = text
			} catch (err) {
                console.error(err)
            }
		}
		throw new Error(message)
	}

	return (await response.json()) as T
}

export function BackendProvider({ children }: { children: React.ReactNode }) {
	const apiBaseUrl = React.useMemo(() => getApiBaseUrl(), [])
	const [accessToken, setAccessToken] = React.useState<string | null>(() =>
		localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
	)

	const isAuthenticated = React.useMemo(() => !!accessToken, [accessToken])

	const [currentUser, setCurrentUser] = React.useState<UserType | null>(null)

	const fetchWithAuth = React.useCallback(
		async (url: string, options: RequestInit = {}): Promise<Response> => {
			const headers = {
				...options.headers,
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			}

			let response = await fetch(url, { ...options, headers })

			if (response.status === 401) {
				try {
					const refreshResponse = await fetch(`${apiBaseUrl}/auth/refresh`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({}),
						credentials: "include",
					})

					if (refreshResponse.ok) {
						const data = await refreshResponse.json()
						localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.access_token)
						setAccessToken(data.access_token)

						const retryHeaders = {
							...options.headers,
							Authorization: `Bearer ${data.access_token}`,
						}
						response = await fetch(url, { ...options, headers: retryHeaders })
					} else {
						localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
						setAccessToken(null)
						setCurrentUser(null)
					}
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				} catch (err) {
					localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
					setAccessToken(null)
					setCurrentUser(null)
				}
			}

			return response
		},
		[apiBaseUrl, accessToken]
	)

	React.useEffect(() => {
		let active = true
		if (accessToken) {
			void (async () => {
				try {
					const response = await fetchWithAuth(`${apiBaseUrl}/api/users/me`)
					if (!response.ok) {
						throw new Error("Failed to fetch user profile")
					}
					const user = await readJsonResponse<UserType>(response)
					if (active) {
						setCurrentUser(user)
					}
				} catch (err) {
					console.error("Error fetching current user profile:", err)
					if (active) {
						setCurrentUser(null)
					}
				}
			})()
		}
		return () => {
			active = false
		}
	}, [accessToken, apiBaseUrl, fetchWithAuth])

	const fetchComments = React.useCallback(
		async (targetDate: Date, groupId?: string | null) => {
			const url = new URL(`${apiBaseUrl}/api/comments`)
			url.searchParams.append("target_date", formatTargetDate(targetDate))
			if (groupId) {
				url.searchParams.append("group_id", groupId)
			}
			const response = await fetchWithAuth(url.toString())
			return await readJsonResponse<CommentType[]>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const createComment = React.useCallback(
		async (content: string, groupId?: string | null) => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/comments`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					content,
					...(groupId ? { group_id: groupId } : {}),
				}),
			})
			return await readJsonResponse<CommentType>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const updateComment = React.useCallback(
		async (commentId: number, content: string) => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/comment/${commentId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ content }),
			})
			return await readJsonResponse<CommentType>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const deleteComment = React.useCallback(
		async (commentId: number) => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/comment/${commentId}`, {
				method: "DELETE",
			})
			return await readJsonResponse<CommentType>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const fetchGroups = React.useCallback(
		async () => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/groups`)
			return await readJsonResponse<GroupType[]>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const login = React.useCallback(
		async (email: string, password: string) => {
			const params = new URLSearchParams()
			params.append("username", email)
			params.append("password", password)

			const response = await fetch(`${apiBaseUrl}/auth/token`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: params.toString(),
				credentials: "include",
			})

			const data = await readJsonResponse<{ access_token: string }>(response)
			localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.access_token)
			setAccessToken(data.access_token)
		},
		[apiBaseUrl]
	)

	const signup = React.useCallback(
		async (name: string, email: string, password: string, groupName?: string) => {
			let groupId: string | null = null
			if (groupName) {
				const groupsResponse = await fetch(`${apiBaseUrl}/auth/groups`)
				if (groupsResponse.ok) {
					const groups = (await groupsResponse.json()) as { id: string; name: string }[]
					const match = groups.find((g) => g.name === groupName)
					if (match) {
						groupId = match.id
					}
				}
			}

			const response = await fetch(`${apiBaseUrl}/auth/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					password,
					full_name: name,
					group_id: groupId,
				}),
			})

			await readJsonResponse(response)
		},
		[apiBaseUrl]
	)

	const logout = React.useCallback(async () => {
		try {
			await fetch(`${apiBaseUrl}/auth/logout`, {
				method: "POST",
				credentials: "include",
			})
		} catch (e) {
			console.error("Logout request failed:", e)
		} finally {
			localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
			setAccessToken(null)
		}
	}, [apiBaseUrl])

	const fetchTasks = React.useCallback(
		async (targetDate: Date, signal?: AbortSignal) => {
			const response = await fetchWithAuth(
				`${apiBaseUrl}/api/tasks?target_date=${formatTargetDate(targetDate)}`,
				{
					signal,
				}
			)

			return await readJsonResponse<BackendTask[]>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const fetchTaskCompletions = React.useCallback(
		async (taskId: number, groupId?: string | null) => {
			const url = new URL(`${apiBaseUrl}/api/tasks/${taskId}/completions`)
			if (groupId) {
				url.searchParams.append("group_id", groupId)
			}
			const response = await fetchWithAuth(url.toString())
			return await readJsonResponse<{ id: string; full_name: string | null; email: string; completed: boolean }[]>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const toggleTaskCompletion = React.useCallback(
		async (taskId: number) => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/tasks/${taskId}/toggle`, {
				method: "POST",
			})

			return await readJsonResponse<TaskToggleResult>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const updateProfile = React.useCallback(
		async (fields: { full_name?: string; email?: string; password?: string }) => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/user`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fields),
			})
			const updated = await readJsonResponse<UserType>(response)
			setCurrentUser(updated)
			return updated
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const updateUser = React.useCallback(
		async (userId: string, fields: { full_name?: string; email?: string; password?: string; role?: string; group_id?: string | null; disabled?: boolean }) => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/user/${userId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fields),
			})
			const updated = await readJsonResponse<UserType>(response)
			setCurrentUser((prevUser) => {
				if (prevUser && prevUser.id === userId) {
					return updated
				}
				return prevUser
			})
			return updated
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const deleteUser = React.useCallback(
		async (userId: string) => {
			await fetchWithAuth(`${apiBaseUrl}/api/user/${userId}`, {
				method: "DELETE",
			})
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const fetchAllUsers = React.useCallback(
		async () => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/users`)
			return await readJsonResponse<UserType[]>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const updateGroup = React.useCallback(
		async (groupId: string, name: string) => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/group/${groupId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name }),
			})
			return await readJsonResponse<GroupType>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const deleteGroup = React.useCallback(
		async (groupId: string) => {
			await fetchWithAuth(`${apiBaseUrl}/api/group/${groupId}`, {
				method: "DELETE",
			})
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const createGroup = React.useCallback(
		async (name: string) => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/group`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name }),
			})
			return await readJsonResponse<GroupType>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const createTask = React.useCallback(
		async (task: { title: string; description: string | null; external_url: string | null; target_date: string }) => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/task`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(task),
			})
			return await readJsonResponse<BackendTask>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const updateTask = React.useCallback(
		async (taskId: number, task: { title: string; description: string | null; external_url: string | null; target_date: string }) => {
			const response = await fetchWithAuth(`${apiBaseUrl}/api/task/${taskId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(task),
			})
			return await readJsonResponse<BackendTask>(response)
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const deleteTask = React.useCallback(
		async (taskId: number) => {
			await fetchWithAuth(`${apiBaseUrl}/api/task/${taskId}`, {
				method: "DELETE",
			})
		},
		[apiBaseUrl, fetchWithAuth]
	)

	const stateValue = React.useMemo(
		() => ({
			accessToken,
			isAuthenticated,
			currentUser,
		}),
		[accessToken, isAuthenticated, currentUser]
	)

	const actionsValue = React.useMemo(
		() => ({
			apiBaseUrl,
			login,
			signup,
			logout,
			fetchTasks,
			fetchTaskCompletions,
			toggleTaskCompletion,
			fetchComments,
			createComment,
			updateComment,
			deleteComment,
			fetchGroups,
			updateProfile,
			updateUser,
			deleteUser,
			fetchAllUsers,
			updateGroup,
			deleteGroup,
			createGroup,
			createTask,
			updateTask,
			deleteTask,
		}),
		[
			apiBaseUrl,
			login,
			signup,
			logout,
			fetchTasks,
			fetchTaskCompletions,
			toggleTaskCompletion,
			fetchComments,
			createComment,
			updateComment,
			deleteComment,
			fetchGroups,
			updateProfile,
			updateUser,
			deleteUser,
			fetchAllUsers,
			updateGroup,
			deleteGroup,
			createGroup,
			createTask,
			updateTask,
			deleteTask,
		]
	)

	return (
		<BackendStateContext.Provider value={stateValue}>
			<BackendActionsContext.Provider value={actionsValue}>
				{children}
			</BackendActionsContext.Provider>
		</BackendStateContext.Provider>
	)
}

export function useBackend() {
	const context = React.useContext(BackendActionsContext)

	if (!context) {
		throw new Error("useBackend must be used within a BackendProvider")
	}

	return context
}

export function useAuth() {
	const state = React.useContext(BackendStateContext)
	const actions = React.useContext(BackendActionsContext)

	if (!state || !actions) {
		throw new Error("useAuth must be used within a BackendProvider")
	}

	return React.useMemo(
		() => ({
			accessToken: state.accessToken,
			isAuthenticated: state.isAuthenticated,
			login: actions.login,
			signup: actions.signup,
			logout: actions.logout,
			currentUser: state.currentUser,
		}),
		[
			state.accessToken,
			state.isAuthenticated,
			actions.login,
			actions.signup,
			actions.logout,
			state.currentUser,
		]
	)
}

export function useTasks(targetDate: Date) {
	const { fetchTasks, toggleTaskCompletion } = useBackend()
	const [tasks, setTasks] = React.useState<BackendTask[]>([])
	const [isLoading, setIsLoading] = React.useState(true)
	const [error, setError] = React.useState<string | null>(null)

	const loadTasks = React.useCallback(async (signal?: AbortSignal) => {
		setIsLoading(true)
		setError(null)

		try {
			const nextTasks = await fetchTasks(targetDate, signal)
			setTasks(nextTasks)
		} catch (requestError) {
			if (requestError instanceof DOMException && requestError.name === "AbortError") {
				return
			}

			setError(requestError instanceof Error ? requestError.message : "Unable to load tasks")
		} finally {
			setIsLoading(false)
		}
	}, [fetchTasks, targetDate])

	const refresh = React.useCallback(async () => {
		await loadTasks()
	}, [loadTasks])

	React.useEffect(() => {
		const controller = new AbortController()
		const timeoutId = window.setTimeout(() => {
			void loadTasks(controller.signal)
		}, 0)

		return () => {
			window.clearTimeout(timeoutId)
			controller.abort()
		}
	}, [loadTasks])

	const toggleTask = React.useCallback(
		async (taskId: number) => {
			let previousTasks: BackendTask[] = []

			setTasks((currentTasks) => {
				previousTasks = currentTasks

				return currentTasks.map((task) =>
					task.id === taskId
						? {
								...task,
								is_completed: !task.is_completed,
							}
						: task
				)
			})

			try {
				await toggleTaskCompletion(taskId)
			} catch (requestError) {
				setTasks(previousTasks)
				setError(requestError instanceof Error ? requestError.message : "Unable to update task")
			}
		},
		[toggleTaskCompletion]
	)

	return React.useMemo(
		() => ({
			tasks,
			isLoading,
			error,
			refresh,
			toggleTask,
		}),
		[tasks, isLoading, error, refresh, toggleTask]
	)
}

export type { BackendTask }
