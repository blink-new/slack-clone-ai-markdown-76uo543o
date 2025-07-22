import React, { useState, useRef, useEffect } from 'react'
import { 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  FileText, 
  MessageSquare,
  Lightbulb,
  Code
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { blink } from '@/blink/client'

interface User {
  id: string
  email: string
  displayName?: string
}

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  onClose: () => void
  user: User
}

const QUICK_PROMPTS = [
  {
    icon: MessageSquare,
    title: 'Improve Message',
    prompt: 'Help me improve this message to be more professional and clear:'
  },
  {
    icon: FileText,
    title: 'Summarize',
    prompt: 'Please summarize the key points from this conversation:'
  },
  {
    icon: Code,
    title: 'Code Review',
    prompt: 'Review this code and suggest improvements:'
  },
  {
    icon: Lightbulb,
    title: 'Brainstorm',
    prompt: 'Help me brainstorm ideas for:'
  }
]

export function AIAssistant({ onClose, user }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi ${user.displayName || user.email}! 👋 I'm your AI assistant. I can help you with:\n\n• **Writing & Editing** - Improve messages, fix grammar, adjust tone\n• **Summarization** - Summarize conversations or documents\n• **Code Help** - Review code, explain concepts, debug issues\n• **Brainstorming** - Generate ideas and creative solutions\n• **Templates** - Create custom document templates\n\nWhat would you like help with today?`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Use Blink AI to generate response
      const response = await blink.ai.generateText({
        prompt: `You are a helpful AI assistant integrated into a Slack-like team collaboration platform. 
        
        User context:
        - User: ${user.displayName || user.email}
        - Platform: Team collaboration app with markdown support
        
        User message: ${input.trim()}
        
        Please provide a helpful, concise response. If the user is asking for help with writing, code, or content creation, provide specific actionable suggestions. Format your response using markdown when appropriate.`,
        maxTokens: 500
      })

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt + ' ')
    textareaRef.current?.focus()
  }

  return (
    <div className="w-80 bg-background border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-slack-purple rounded-md">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Powered by AI</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border">
        <h4 className="text-sm font-medium text-foreground mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_PROMPTS.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="h-auto p-2 flex flex-col items-center text-center"
              onClick={() => handleQuickPrompt(prompt.prompt)}
            >
              <prompt.icon className="h-4 w-4 mb-1" />
              <span className="text-xs">{prompt.title}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-slack-purple text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="markdown-content text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        code: ({ node, inline, className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <pre className="bg-background p-2 rounded text-xs overflow-x-auto my-1">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          ) : (
                            <code className="bg-background px-1 py-0.5 rounded text-xs font-mono" {...props}>
                              {children}
                            </code>
                          )
                        },
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 max-w-[85%]">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slack-purple rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slack-purple rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slack-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="resize-none pr-12 min-h-[44px] max-h-[120px]"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="absolute bottom-2 right-2 h-7 w-7 p-0 bg-slack-green hover:bg-slack-active"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}