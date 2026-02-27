# Real-Time Features

## Approach Comparison

| Method | Use Case | Pros | Cons |
|--------|----------|------|------|
| **Polling** | Simple updates, low frequency | Easy to implement | Inefficient, delayed |
| **SSE** | Server-to-client only | Simple, auto-reconnect | One-way only |
| **WebSockets** | Bidirectional, high frequency | Real-time, efficient | Complex, stateful |
| **Pusher/Ably** | Production real-time | Managed, scalable | Cost, vendor lock-in |

## Server-Sent Events (SSE)

### Server Route

```typescript
// app/api/events/route.ts
export const dynamic = "force-dynamic"

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode("data: connected\n\n"))

      // Simulated event loop (replace with real event source)
      let count = 0
      const interval = setInterval(() => {
        const data = JSON.stringify({
          type: "update",
          count: ++count,
          timestamp: new Date().toISOString(),
        })

        controller.enqueue(encoder.encode(`data: ${data}\n\n`))

        // Close after 100 events (or based on your logic)
        if (count >= 100) {
          clearInterval(interval)
          controller.close()
        }
      }, 1000)

      // Cleanup on close
      return () => clearInterval(interval)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

### Database-Driven SSE

```typescript
// app/api/notifications/stream/route.ts
import { auth } from "@/auth"
import { db } from "@/lib/db/client"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const encoder = new TextEncoder()
  let lastChecked = new Date()

  const stream = new ReadableStream({
    async start(controller) {
      const checkForUpdates = async () => {
        try {
          const notifications = await db.notification.findMany({
            where: {
              userId: session.user.id,
              createdAt: { gt: lastChecked },
              read: false,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          })

          if (notifications.length > 0) {
            const data = JSON.stringify({ notifications })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            lastChecked = new Date()
          }
        } catch (error) {
          console.error("SSE error:", error)
        }
      }

      // Initial check
      await checkForUpdates()

      // Poll for new notifications
      const interval = setInterval(checkForUpdates, 5000)

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"))
      }, 30000)

      return () => {
        clearInterval(interval)
        clearInterval(heartbeat)
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

### Client SSE Hook

```typescript
// hooks/use-event-source.ts
"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface UseEventSourceOptions {
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
  reconnectInterval?: number
}

export function useEventSource(url: string, options: UseEventSourceOptions = {}) {
  const { onMessage, onError, reconnectInterval = 3000 } = options
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }

    eventSource.onmessage = (event) => {
      if (event.data === "connected") return

      try {
        const data = JSON.parse(event.data)
        onMessage?.(data)
      } catch {
        onMessage?.(event.data)
      }
    }

    eventSource.onerror = (error) => {
      setIsConnected(false)
      onError?.(error)
      eventSource.close()

      // Auto-reconnect
      reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval)
    }
  }, [url, onMessage, onError, reconnectInterval])

  useEffect(() => {
    connect()

    return () => {
      eventSourceRef.current?.close()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close()
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
  }, [])

  return { isConnected, disconnect }
}
```

### SSE Component Example

```typescript
// features/notifications/components/NotificationBell.interactive.tsx
"use client"

import { useState } from "react"
import { useEventSource } from "@/hooks/use-event-source"

interface Notification {
  id: string
  message: string
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const { isConnected } = useEventSource("/api/notifications/stream", {
    onMessage: (data) => {
      if (data.notifications) {
        setNotifications((prev) => [...data.notifications, ...prev])
        setUnreadCount((prev) => prev + data.notifications.length)
      }
    },
  })

  return (
    <div className="relative">
      <button aria-label="Notifications">
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <span className={isConnected ? "text-green-500" : "text-red-500"}>
        {isConnected ? "Live" : "Disconnected"}
      </span>
    </div>
  )
}
```

## WebSockets with Socket.io

### Server Setup (Separate Process)

```typescript
// server/websocket.ts
import { Server } from "socket.io"
import { createServer } from "http"
import { parse } from "cookie"
import { verifyToken } from "@/lib/auth/jwt"

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
    credentials: true,
  },
})

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const cookies = parse(socket.handshake.headers.cookie || "")
    const token = cookies["session-token"]

    if (!token) {
      return next(new Error("Authentication required"))
    }

    const payload = await verifyToken(token)
    socket.data.userId = payload.sub
    next()
  } catch {
    next(new Error("Invalid token"))
  }
})

io.on("connection", (socket) => {
  const userId = socket.data.userId
  console.log(`User ${userId} connected`)

  // Join user-specific room
  socket.join(`user:${userId}`)

  // Handle events
  socket.on("join-room", (roomId: string) => {
    socket.join(`room:${roomId}`)
  })

  socket.on("leave-room", (roomId: string) => {
    socket.leave(`room:${roomId}`)
  })

  socket.on("send-message", async (data: { roomId: string; content: string }) => {
    // Save to database
    const message = await saveMessage(userId, data.roomId, data.content)

    // Broadcast to room
    io.to(`room:${data.roomId}`).emit("new-message", message)
  })

  socket.on("disconnect", () => {
    console.log(`User ${userId} disconnected`)
  })
})

httpServer.listen(3001, () => {
  console.log("WebSocket server running on port 3001")
})
```

### Client Hook

```typescript
// hooks/use-socket.ts
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      withCredentials: true,
      transports: ["websocket"],
    })

    socketRef.current = socket

    socket.on("connect", () => setIsConnected(true))
    socket.on("disconnect", () => setIsConnected(false))

    return () => {
      socket.disconnect()
    }
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data)
  }, [])

  const on = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback)
    return () => {
      socketRef.current?.off(event, callback)
    }
  }, [])

  return { isConnected, emit, on }
}
```

### Chat Component

```typescript
// features/chat/components/ChatRoom.interactive.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useSocket } from "@/hooks/use-socket"

interface Message {
  id: string
  userId: string
  content: string
  createdAt: string
}

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isConnected, emit, on } = useSocket()

  useEffect(() => {
    // Join room
    emit("join-room", roomId)

    // Listen for new messages
    const unsubscribe = on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    return () => {
      emit("leave-room", roomId)
      unsubscribe()
    }
  }, [roomId, emit, on])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    emit("send-message", { roomId, content: input })
    setInput("")
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message) => (
          <div key={message.id} className="p-2 bg-gray-100 rounded">
            <p>{message.content}</p>
            <span className="text-xs text-gray-500">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1"
          />
          <button type="submit" disabled={!isConnected}>
            Send
          </button>
        </div>
        {!isConnected && (
          <p className="text-red-500 text-sm mt-1">Disconnected. Reconnecting...</p>
        )}
      </form>
    </div>
  )
}
```

## Polling Pattern

### SWR Polling

```typescript
// features/dashboard/components/LiveStats.interactive.tsx
"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LiveStats() {
  const { data, error, isLoading } = useSWR("/api/stats", fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  })

  if (isLoading) return <StatsSkeletons />
  if (error) return <div>Failed to load stats</div>

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard title="Active Users" value={data.activeUsers} />
      <StatCard title="Revenue" value={data.revenue} />
      <StatCard title="Orders" value={data.orders} />
    </div>
  )
}
```

### Manual Polling Hook

```typescript
// hooks/use-polling.ts
"use client"

import { useState, useEffect, useCallback } from "react"

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>
  interval: number
  enabled?: boolean
}

export function usePolling<T>({
  fetcher,
  interval,
  enabled = true,
}: UsePollingOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const result = await fetcher()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    if (!enabled) return

    fetchData()
    const id = setInterval(fetchData, interval)

    return () => clearInterval(id)
  }, [fetchData, interval, enabled])

  return { data, error, isLoading, refetch: fetchData }
}
```

## Optimistic Updates

### With Server Actions

```typescript
// features/todos/components/TodoItem.interactive.tsx
"use client"

import { useOptimistic, useTransition } from "react"
import { toggleTodo } from "../actions/toggle-todo"

interface Todo {
  id: string
  text: string
  completed: boolean
}

export function TodoItem({ todo }: { todo: Todo }) {
  const [optimisticTodo, setOptimisticTodo] = useOptimistic(todo)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      // Optimistically update UI
      setOptimisticTodo({ ...optimisticTodo, completed: !optimisticTodo.completed })

      // Call server action
      const result = await toggleTodo(todo.id)

      if (!result.success) {
        // Revert on error (optimistic state automatically reverts)
        console.error(result.error)
      }
    })
  }

  return (
    <div className={isPending ? "opacity-50" : ""}>
      <input
        type="checkbox"
        checked={optimisticTodo.completed}
        onChange={handleToggle}
      />
      <span className={optimisticTodo.completed ? "line-through" : ""}>
        {optimisticTodo.text}
      </span>
    </div>
  )
}
```

### With SWR Mutation

```typescript
// features/posts/components/LikeButton.interactive.tsx
"use client"

import useSWR, { useSWRConfig } from "swr"

export function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const { mutate } = useSWRConfig()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikes)

  const handleLike = async () => {
    // Optimistic update
    const newIsLiked = !isLiked
    const newCount = newIsLiked ? likeCount + 1 : likeCount - 1

    setIsLiked(newIsLiked)
    setLikeCount(newCount)

    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: newIsLiked ? "POST" : "DELETE",
      })

      // Revalidate related data
      mutate(`/api/posts/${postId}`)
    } catch {
      // Revert on error
      setIsLiked(!newIsLiked)
      setLikeCount(likeCount)
    }
  }

  return (
    <button onClick={handleLike}>
      {isLiked ? "❤️" : "🤍"} {likeCount}
    </button>
  )
}
```

## Pusher Integration

### Setup

```bash
npm install pusher pusher-js
```

```typescript
// lib/pusher/server.ts
import Pusher from "pusher"

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

// lib/pusher/client.ts
import PusherClient from "pusher-js"

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
)
```

### Trigger Events

```typescript
// features/notifications/actions/send-notification.ts
"use server"

import { pusher } from "@/lib/pusher/server"

export async function sendNotification(userId: string, message: string) {
  // Save to database
  const notification = await db.notification.create({
    data: { userId, message },
  })

  // Trigger real-time event
  await pusher.trigger(`user-${userId}`, "new-notification", notification)

  return { success: true }
}
```

### Subscribe to Events

```typescript
// features/notifications/hooks/use-notifications.ts
"use client"

import { useEffect, useState } from "react"
import { pusherClient } from "@/lib/pusher/client"

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const channel = pusherClient.subscribe(`user-${userId}`)

    channel.bind("new-notification", (data: Notification) => {
      setNotifications((prev) => [data, ...prev])
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`user-${userId}`)
    }
  }, [userId])

  return notifications
}
```

## Best Practices

| Scenario | Recommendation |
|----------|----------------|
| Notifications | SSE or Pusher |
| Chat | WebSockets or Pusher |
| Live dashboard | Polling (SWR) or SSE |
| Collaborative editing | WebSockets |
| Activity feed | SSE |
| Gaming | WebSockets |

## Real-Time Checklist

- [ ] Choose appropriate method for use case
- [ ] Implement reconnection logic
- [ ] Handle connection state in UI
- [ ] Use optimistic updates for responsiveness
- [ ] Authenticate WebSocket/SSE connections
- [ ] Implement proper cleanup on unmount
- [ ] Consider serverless constraints
- [ ] Add heartbeat for long-lived connections
- [ ] Handle offline/online transitions
- [ ] Test with network throttling