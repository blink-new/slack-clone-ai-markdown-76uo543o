import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  MoreHorizontal, 
  MessageSquare, 
  Smile, 
  Edit, 
  Trash2,
  Copy
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatDistanceToNow } from 'date-fns'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  displayName?: string
}

interface Message {
  id: string
  channelId: string
  userId: string
  content: string
  messageType: string
  threadId?: string
  replyCount: number
  createdAt: string
  updatedAt: string
}

interface MessageItemProps {
  message: Message
  currentUser: User
  showAvatar: boolean
  searchQuery?: string
  onMessageDeleted?: (messageId: string) => void
}

export function MessageItem({ message, currentUser, showAvatar, searchQuery = '', onMessageDeleted }: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  
  const isOwnMessage = message.userId === currentUser.id
  const messageTime = new Date(message.createdAt)
  const timeAgo = formatDistanceToNow(messageTime, { addSuffix: true })

  // Get user display info (in a real app, you'd fetch this from a users table)
  const getUserDisplayName = (userId: string) => {
    if (userId === currentUser.id) {
      return currentUser.displayName || currentUser.email
    }
    return `User ${userId.slice(-4)}` // Fallback for demo
  }

  const getUserInitials = (userId: string) => {
    if (userId === currentUser.id) {
      return currentUser.displayName?.[0] || currentUser.email[0].toUpperCase()
    }
    return userId.slice(-2).toUpperCase()
  }

  // Highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text
    
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content)
  }

  const handleReply = () => {
    // TODO: Implement reply functionality
    console.log('Reply to message:', message.id)
  }

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit message:', message.id)
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      await blink.db.messages.delete(message.id)
      toast({
        title: 'Message deleted',
        description: 'The message has been deleted successfully.'
      })
      onMessageDeleted?.(message.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting message:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete message. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className={`group relative py-2 px-3 rounded-md hover:bg-muted/50 transition-colors ${
        showAvatar ? 'mt-4' : 'mt-1'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {showAvatar ? (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-slack-green text-white text-xs">
                {getUserInitials(message.userId)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8 h-8 flex items-center justify-center">
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          {showAvatar && (
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-sm text-foreground">
                {getUserDisplayName(message.userId)}
              </span>
              <span className="text-xs text-muted-foreground">
                {timeAgo}
              </span>
            </div>
          )}

          {/* Message Body */}
          <div className="text-sm text-foreground">
            {message.messageType === 'text' ? (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    // Custom components for better styling
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
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-muted pl-4 italic text-muted-foreground my-2">
                        {children}
                      </blockquote>
                    ),
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slack-green hover:underline"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {searchQuery ? 
                    highlightSearchTerm(message.content, searchQuery) : 
                    message.content
                  }
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-muted-foreground italic">
                Unsupported message type: {message.messageType}
              </div>
            )}
          </div>

          {/* Thread indicator */}
          {message.replyCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-slack-green hover:bg-slack-green/10"
              onClick={handleReply}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </Button>
          )}
        </div>
      </div>

      {/* Message Actions */}
      {(isHovered || isOwnMessage) && (
        <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1 bg-background border border-border rounded-md shadow-sm">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleReply}>
              <MessageSquare className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Smile className="h-3 w-3" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyMessage}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy message
                </DropdownMenuItem>
                {isOwnMessage && (
                  <>
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit message
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete message
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}