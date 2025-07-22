import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Hash, Lock } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  displayName?: string
}

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeGroup: string | null
  user: User
}

export function CreateChannelDialog({ 
  open, 
  onOpenChange, 
  activeGroup, 
  user 
}: CreateChannelDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !activeGroup) return

    setIsLoading(true)
    
    try {
      // Create channel
      await blink.db.channels.create({
        id: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        groupId: activeGroup,
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description.trim() || undefined,
        isPrivate: isPrivate ? 1 : 0,
        createdBy: user.id
      })

      toast({
        title: 'Channel created',
        description: `#${name.trim().toLowerCase().replace(/\s+/g, '-')} has been created successfully.`
      })

      // Reset form and close dialog
      setName('')
      setDescription('')
      setIsPrivate(false)
      onOpenChange(false)
      
      // Refresh the page to show new channel
      window.location.reload()
    } catch (error) {
      console.error('Error creating channel:', error)
      toast({
        title: 'Error',
        description: 'Failed to create channel. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const channelName = name.trim().toLowerCase().replace(/\s+/g, '-')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Hash className="h-5 w-5" />
            <span>Create a channel</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel name</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. marketing-team"
                className="pl-9"
                required
              />
            </div>
            {channelName && (
              <p className="text-sm text-muted-foreground">
                Channel will be created as: <span className="font-mono">#{channelName}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-description">Description (optional)</Label>
            <Textarea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="private-channel">Make private</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Only invited members can see this channel
              </p>
            </div>
            <Switch
              id="private-channel"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="bg-slack-green hover:bg-slack-active"
            >
              {isLoading ? 'Creating...' : 'Create Channel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}