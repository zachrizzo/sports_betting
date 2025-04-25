"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  ArrowRightIcon as ArrowsMaximize,
  ArrowLeftIcon as ArrowsMinimize,
  Loader2,
} from "lucide-react"
import { useSupabase } from "@/contexts/supabase-provider"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { getChatMessages, saveChatMessage } from "@/lib/services"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useSupabase()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom()
    }
  }, [messages, isOpen, isMinimized])

  // Load chat history when user is authenticated
  useEffect(() => {
    const loadChatHistory = async () => {
      if (user) {
        try {
          const chatMessages = await getChatMessages(user.id)
          if (chatMessages && chatMessages.length > 0) {
            const formattedMessages = chatMessages.map((msg) => ({
              id: msg.id,
              content: msg.content,
              role: msg.role as "user" | "assistant",
              timestamp: new Date(msg.created_at),
            }))
            setMessages(formattedMessages)
          } else {
            // Set default welcome message if no history
            setMessages([
              {
                id: "welcome",
                content: "Hello! I'm your betting assistant. How can I help you today?",
                role: "assistant",
                timestamp: new Date(),
              },
            ])
          }
        } catch (error) {
          console.error("Error loading chat history:", error)
          // Set default welcome message on error
          setMessages([
            {
              id: "welcome",
              content: "Hello! I'm your betting assistant. How can I help you today?",
              role: "assistant",
              timestamp: new Date(),
            },
          ])
        }
      } else {
        // Set default welcome message for non-authenticated users
        setMessages([
          {
            id: "welcome",
            content: "Hello! I'm your betting assistant. How can I help you today?",
            role: "assistant",
            timestamp: new Date(),
          },
        ])
      }
    }

    if (isOpen) {
      loadChatHistory()
    }
  }, [isOpen, user])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Save user message to Supabase if authenticated
    if (user) {
      try {
        await saveChatMessage(user.id, "user", input)
      } catch (error) {
        console.error("Error saving user message:", error)
      }
    }

    // Simulate API call to OpenAI
    setTimeout(async () => {
      const responses = [
        "Based on recent performance data, LeBron James has a 65% chance of hitting the over on his points prop (25.5) against the Celtics tonight.",
        "The Lakers vs Celtics game has an over/under of 214.5. Our simulations show a 55% chance of the under hitting based on recent defensive metrics.",
        "Jayson Tatum has averaged 28.3 points in his last 5 games against the Lakers. His current prop is set at 26.5 points.",
        "Looking at the Warriors vs Nets game, Stephen Curry has hit the over on his three-pointers prop in 7 of his last 10 games.",
        "Our model gives the Bucks a 62% chance to cover the -3.5 spread against the 76ers tonight based on recent form and matchup history.",
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)

      // Save assistant message to Supabase if authenticated
      if (user) {
        try {
          await saveChatMessage(user.id, "assistant", randomResponse)
        } catch (error) {
          console.error("Error saving assistant message:", error)
        }
      }
    }, 1000)
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn("origin-bottom-right shadow-lg", isExpanded ? "fixed inset-4 md:inset-10" : "w-80 md:w-96")}
          >
            <Card
              className={cn(
                "flex flex-col h-full border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
                isMinimized ? "h-14" : isExpanded ? "h-full" : "h-[500px]",
              )}
            >
              <CardHeader
                className={cn(
                  "p-3 flex flex-row items-center justify-between border-b",
                  isMinimized ? "border-transparent" : "border-border/50",
                )}
              >
                <CardTitle className="text-sm flex items-center gap-2">
                  <Avatar className="h-6 w-6 border border-primary/20">
                    <AvatarImage src="/placeholder.svg?height=24&width=24" alt="AI" />
                    <AvatarFallback className="bg-primary/20 text-primary">AI</AvatarFallback>
                  </Avatar>
                  Betting Assistant
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleMinimize}>
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleExpand}>
                    {isExpanded ? <ArrowsMinimize className="h-4 w-4" /> : <ArrowsMaximize className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleChat}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {!isMinimized && (
                <>
                  <CardContent className="p-3 flex-1 overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                      <div className="flex flex-col gap-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={cn(
                                "flex max-w-[80%] gap-3 rounded-lg px-3 py-2",
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted/80 border border-border/50",
                              )}
                            >
                              {message.role === "assistant" && (
                                <Avatar className="h-6 w-6 mt-1 border border-primary/20">
                                  <AvatarImage src="/placeholder.svg?height=24&width=24" alt="AI" />
                                  <AvatarFallback className="bg-primary/20 text-primary">AI</AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex flex-col">
                                <p className="text-sm">{message.content}</p>
                                <span className="mt-1 text-xs opacity-70">
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="flex max-w-[80%] gap-3 rounded-lg bg-muted/80 border border-border/50 px-3 py-2">
                              <Avatar className="h-6 w-6 mt-1 border border-primary/20">
                                <AvatarImage src="/placeholder.svg?height=24&width=24" alt="AI" />
                                <AvatarFallback className="bg-primary/20 text-primary">AI</AvatarFallback>
                              </Avatar>
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="p-3 border-t border-border/50">
                    <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                      <Input
                        placeholder="Ask about betting..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="h-9 text-sm bg-background border-border/50 focus-visible:ring-primary/50"
                      />
                      <Button type="submit" size="icon" className="h-9 w-9" disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </CardFooter>
                </>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={toggleChat}
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
