import React, { useState, useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { blink } from '@/blink/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatArea } from '@/components/chat/ChatArea'
import { AIAssistant } from '@/components/ai/AIAssistant'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface User {
  id: string
  email: string
  displayName?: string
}

interface Group {
  id: string
  name: string
  description?: string
  createdBy: string
  createdAt: string
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

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [isAIOpen, setIsAIOpen] = useState(false)

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load user's groups when authenticated
  useEffect(() => {
    if (!user?.id) return

    const loadGroups = async () => {
      try {
        // Get groups where user is a member
        const userGroups = await blink.db.groupMembers.list({
          where: { userId: user.id },
          orderBy: { joinedAt: 'desc' }
        })

        if (userGroups.length > 0) {
          const groupIds = userGroups.map(gm => gm.groupId)
          
          // Fetch groups individually to avoid OR syntax issues
          const groupsData = []
          for (const groupId of groupIds) {
            try {
              const group = await blink.db.groups.list({
                where: { id: groupId },
                limit: 1
              })
              if (group.length > 0) {
                groupsData.push(group[0])
              }
            } catch (error) {
              console.warn(`Failed to fetch group ${groupId}:`, error)
            }
          }
          
          // Sort by creation date
          groupsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          setGroups(groupsData)
          
          // Set first group as active if none selected
          if (!activeGroup && groupsData.length > 0) {
            setActiveGroup(groupsData[0].id)
          }
        } else {
          // Create a default group for new users
          const defaultGroup = await blink.db.groups.create({
            id: `group_${Date.now()}`,
            name: 'General',
            description: 'Default workspace',
            createdBy: user.id
          })

          // Add user as member
          await blink.db.groupMembers.create({
            id: `member_${Date.now()}`,
            groupId: defaultGroup.id,
            userId: user.id,
            role: 'admin'
          })

          // Create default channel
          const defaultChannel = await blink.db.channels.create({
            id: `channel_${Date.now()}`,
            groupId: defaultGroup.id,
            name: 'general',
            description: 'General discussion',
            isPrivate: false,
            createdBy: user.id
          })

          setGroups([defaultGroup])
          setChannels([defaultChannel])
          setActiveGroup(defaultGroup.id)
          setActiveChannel(defaultChannel.id)
        }
      } catch (error) {
        console.error('Error loading groups:', error)
      }
    }

    loadGroups()
  }, [user?.id, activeGroup])

  // Load channels for active group
  useEffect(() => {
    if (!activeGroup) return

    const loadChannels = async () => {
      try {
        const channelsData = await blink.db.channels.list({
          where: { groupId: activeGroup },
          orderBy: { createdAt: 'asc' }
        })
        setChannels(channelsData)
        
        // Set first channel as active if none selected
        if (!activeChannel && channelsData.length > 0) {
          setActiveChannel(channelsData[0].id)
        }
      } catch (error) {
        console.error('Error loading channels:', error)
      }
    }

    loadChannels()
  }, [activeGroup, activeChannel])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to LeverageLabsTeamChat</h1>
          <p className="text-muted-foreground mb-6">Please sign in to continue</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-slack-purple text-white px-6 py-2 rounded-md hover:bg-slack-hover transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar
        groups={groups}
        channels={channels}
        activeGroup={activeGroup}
        activeChannel={activeChannel}
        onGroupSelect={setActiveGroup}
        onChannelSelect={setActiveChannel}
        user={user}
        onAIToggle={() => setIsAIOpen(!isAIOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex">
        <ChatArea
          activeChannel={activeChannel}
          user={user}
          isAIOpen={isAIOpen}
        />
        
        {/* AI Assistant Panel */}
        {isAIOpen && (
          <AIAssistant
            onClose={() => setIsAIOpen(false)}
            user={user}
          />
        )}
      </div>

      <Toaster />
    </div>
  )
}

export default App