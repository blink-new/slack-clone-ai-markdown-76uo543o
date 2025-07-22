import React, { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Paperclip, 
  Smile, 
  Code, 
  Bold, 
  Italic, 
  List,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface User {
  id: string
  email: string
  displayName?: string
}

interface MessageInputProps {
  onSendMessage: (content: string, messageType?: string) => void
  placeholder?: string
  user: User
}

export function MessageInput({ onSendMessage, placeholder = "Type a message...", user }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSend = () => {
    if (!message.trim()) return
    
    onSendMessage(message.trim())
    setMessage('')
    setIsPreviewMode(false)
    setIsExpanded(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    
    if (e.key === 'Enter' && e.shiftKey) {
      setIsExpanded(true)
    }
  }

  const insertMarkdown = (syntax: string, placeholder: string = '') => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = message.substring(start, end)
    
    let newText = ''
    let cursorPos = start

    switch (syntax) {
      case 'bold':
        newText = `**${selectedText || placeholder}**`
        cursorPos = start + 2 + (selectedText || placeholder).length
        break
      case 'italic':
        newText = `*${selectedText || placeholder}*`
        cursorPos = start + 1 + (selectedText || placeholder).length
        break
      case 'code':
        if (selectedText.includes('\n')) {
          newText = `\`\`\`\n${selectedText || placeholder}\n\`\`\``
          cursorPos = start + 4 + (selectedText || placeholder).length
        } else {
          newText = `\`${selectedText || placeholder}\``
          cursorPos = start + 1 + (selectedText || placeholder).length
        }
        break
      case 'list':
        newText = `- ${selectedText || placeholder}`
        cursorPos = start + 2 + (selectedText || placeholder).length
        break
      default:
        return
    }

    const newMessage = message.substring(0, start) + newText + message.substring(end)
    setMessage(newMessage)
    
    // Set cursor position after state update
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(cursorPos, cursorPos)
    }, 0)
  }

  const handleFileUpload = () => {
    // TODO: Implement file upload
    console.log('File upload clicked')
  }

  const handleEmojiPicker = () => {
    // TODO: Implement emoji picker
    console.log('Emoji picker clicked')
  }

  return (
    <div className="space-y-2">
      {/* Formatting Toolbar (shown when expanded) */}
      {isExpanded && (
        <div className="flex items-center space-x-1 p-2 bg-muted rounded-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('bold', 'bold text')}
            className="h-7 w-7 p-0"
          >
            <Bold className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('italic', 'italic text')}
            className="h-7 w-7 p-0"
          >
            <Italic className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('code', 'code')}
            className="h-7 w-7 p-0"
          >
            <Code className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('list', 'list item')}
            className="h-7 w-7 p-0"
          >
            <List className="h-3 w-3" />
          </Button>
          
          <div className="flex-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="h-7 px-2"
          >
            {isPreviewMode ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </>
            )}
          </Button>
        </div>
      )}

      {/* Message Input Area */}
      <div className="relative">
        {isExpanded && isPreviewMode ? (
          // Preview Mode
          <div className="min-h-[100px] max-h-[300px] overflow-y-auto p-3 border border-border rounded-md bg-background">
            {message.trim() ? (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code: ({ node, inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <pre className="bg-muted p-3 rounded-md overflow-x-auto my-2">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                >
                  {message}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground italic">Nothing to preview</p>
            )}
          </div>
        ) : (
          // Edit Mode
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsExpanded(true)}
            placeholder={placeholder}
            className={`resize-none ${isExpanded ? 'min-h-[100px] max-h-[300px]' : 'min-h-[44px] max-h-[120px]'} pr-20`}
            rows={isExpanded ? 4 : 1}
          />
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-1">
          {!isExpanded && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileUpload}
                className="h-7 w-7 p-0"
              >
                <Paperclip className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEmojiPicker}
                className="h-7 w-7 p-0"
              >
                <Smile className="h-3 w-3" />
              </Button>
            </>
          )}
          
          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            size="sm"
            className="h-7 w-7 p-0 bg-slack-green hover:bg-slack-active"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Markdown Help */}
      {isExpanded && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Markdown supported:</span> **bold**, *italic*, `code`, ```code blocks```, - lists, {'>'}quotes, [links](url)
        </div>
      )}
    </div>
  )
}