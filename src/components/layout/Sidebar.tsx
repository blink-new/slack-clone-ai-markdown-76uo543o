import React, { useState } from 'react'
import { 
  Hash, 
  Plus, 
  Settings, 
  Users, 
  Bot, 
  ChevronDown, 
  ChevronRight,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { CreateChannelDialog } from '@/components/dialogs/CreateChannelDialog'
import { CreateWorkspaceDialog } from '@/components/dialogs/CreateWorkspaceDialog'
import { blink } from '@/blink/client'

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

interface SidebarProps {
  groups: Group[]
  channels: Channel[]
  activeGroup: string | null
  activeChannel: string | null
  onGroupSelect: (groupId: string) => void
  onChannelSelect: (channelId: string) => void
  user: User
  onAIToggle: () => void
}

export function Sidebar({
  groups,
  channels,
  activeGroup,
  activeChannel,
  onGroupSelect,
  onChannelSelect,
  user,
  onAIToggle
}: SidebarProps) {
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)

  const activeGroupData = groups.find(g => g.id === activeGroup)
  const groupChannels = channels.filter(c => c.groupId === activeGroup)

  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <div className="w-64 bg-slack-sidebar text-white flex flex-col h-full">
      {/* Workspace Header */}
      <div className="p-4 border-b border-slack-hover">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-white hover:bg-slack-hover">
              <span className="font-semibold truncate">
                {activeGroupData?.name || 'Select Workspace'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {groups.map((group) => (
              <DropdownMenuItem
                key={group.id}
                onClick={() => onGroupSelect(group.id)}
                className={activeGroup === group.id ? 'bg-accent' : ''}
              >
                <span className="truncate">{group.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowCreateWorkspace(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* AI Assistant */}
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-slack-hover mb-4"
            onClick={onAIToggle}
          >
            <Bot className="h-4 w-4 mr-3" />
            AI Assistant
          </Button>

          {/* Channels Section */}
          <div className="mb-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-slack-hover p-2"
              onClick={() => setIsChannelsExpanded(!isChannelsExpanded)}
            >
              {isChannelsExpanded ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm font-medium">Channels</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 w-6 p-0 hover:bg-slack-hover"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCreateChannel(true)
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </Button>

            {isChannelsExpanded && (
              <div className="ml-2 mt-1">
                {groupChannels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-slack-hover p-2 ${
                      activeChannel === channel.id ? 'bg-slack-active' : ''
                    }`}
                    onClick={() => onChannelSelect(channel.id)}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    <span className="truncate">{channel.name}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slack-hover">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-slack-hover">
              <Avatar className="h-6 w-6 mr-3">
                <AvatarFallback className="bg-slack-green text-white text-xs">
                  {user.displayName?.[0] || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium truncate">
                  {user.displayName || user.email}
                </div>
                <div className="text-xs text-gray-300">Online</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="h-4 w-4 mr-2" />
              Manage Team
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs */}
      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        activeGroup={activeGroup}
        user={user}
      />

      <CreateWorkspaceDialog
        open={showCreateWorkspace}
        onOpenChange={setShowCreateWorkspace}
        user={user}
      />
    </div>
  )
}