import React, { useState, useEffect, useRef } from 'react'
import { Hash, Users, Search, Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { blink } from '@/blink/client'

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

interface Channel {
  id: string
  groupId: string
  name: string
  description?: string
  isPrivate: boolean
  createdBy: string
  createdAt: string
}

interface ChatAreaProps {
  activeChannel: string | null
  user: User
  isAIOpen: boolean
}

export function ChatArea({ activeChannel, user, isAIOpen }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load channel data and messages
  useEffect(() => {
    if (!activeChannel) return

    const loadChannelData = async () => {
      setLoading(true)
      try {
        // Load channel info
        const channelData = await blink.db.channels.list({
          where: { id: activeChannel },
          limit: 1
        })
        
        if (channelData.length > 0) {
          setChannel(channelData[0])
        }

        // Load messages
        const messagesData = await blink.db.messages.list({
          where: { channelId: activeChannel },
          orderBy: { createdAt: 'asc' },
          limit: 100
        })
        
        setMessages(messagesData)
      } catch (error) {
        console.error('Error loading channel data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChannelData()
  }, [activeChannel])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle sending new message
  const handleSendMessage = async (content: string, messageType: string = 'text') => {
    if (!activeChannel || !content.trim()) return

    try {
      const newMessage = await blink.db.messages.create({
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        channelId: activeChannel,
        userId: user.id,
        content: content.trim(),
        messageType,
        replyCount: 0
      })

      // Add to local state for immediate UI update
      setMessages(prev => [...prev, newMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Handle message deletion
  const handleMessageDeleted = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  if (!activeChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Select a channel to start messaging
          </h3>
          <p className="text-muted-foreground">
            Choose a channel from the sidebar to view and send messages.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 flex flex-col bg-background ${isAIOpen ? 'mr-0' : ''}`}>
      {/* Channel Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center">
          <Hash className="h-5 w-5 text-muted-foreground mr-2" />
          <div>
            <h2 className="font-semibold text-foreground">
              {channel?.name || 'Loading...'}
            </h2>
            {channel?.description && (
              <p className="text-xs text-muted-foreground">
                {channel.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          {/* Channel Actions */}
          <Button variant="ghost" size="sm">
            <Pin className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-slack-purple border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            <MessageList 
              messages={messages} 
              user={user}
              searchQuery={searchQuery}
              onMessageDeleted={handleMessageDeleted}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder={`Message #${channel?.name || 'channel'}`}
          user={user}
        />
      </div>
    </div>
  )
}