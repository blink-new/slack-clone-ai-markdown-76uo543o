import React from 'react'
import { MessageItem } from '@/components/chat/MessageItem'

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

interface MessageListProps {
  messages: Message[]
  user: User
  searchQuery?: string
  onMessageDeleted?: (messageId: string) => void
}

export function MessageList({ messages, user, searchQuery = '', onMessageDeleted }: MessageListProps) {
  // Filter messages based on search query
  const filteredMessages = messages.filter(message => {
    if (!searchQuery.trim()) return true
    return message.content.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (filteredMessages.length === 0) {
    if (searchQuery.trim()) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No messages found for "{searchQuery}"</p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">This is the beginning of your conversation.</p>
          <p className="text-sm text-muted-foreground">Send a message to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      <div className="space-y-2">
        {filteredMessages.map((message, index) => {
          const prevMessage = index > 0 ? filteredMessages[index - 1] : null
          const showAvatar = !prevMessage || 
            prevMessage.userId !== message.userId ||
            new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000 // 5 minutes

          return (
            <MessageItem
              key={message.id}
              message={message}
              currentUser={user}
              showAvatar={showAvatar}
              searchQuery={searchQuery}
              onMessageDeleted={onMessageDeleted}
            />
          )
        })}
      </div>
    </div>
  )
}