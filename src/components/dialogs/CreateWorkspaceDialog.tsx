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
import { Building2 } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  displayName?: string
}

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onWorkspaceCreated?: () => void
}

export function CreateWorkspaceDialog({ 
  open, 
  onOpenChange, 
  user,
  onWorkspaceCreated
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return

    setIsLoading(true)
    
    try {
      // Create workspace/group
      const newGroup = await blink.db.groups.create({
        id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description.trim() || undefined,
        createdBy: user.id
      })

      // Add user as admin member
      await blink.db.groupMembers.create({
        id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        groupId: newGroup.id,
        userId: user.id,
        role: 'admin'
      })

      // Create default general channel
      await blink.db.channels.create({
        id: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        groupId: newGroup.id,
        name: 'general',
        description: 'General discussion',
        isPrivate: false,
        createdBy: user.id
      })

      toast({
        title: 'Workspace created',
        description: `${name.trim()} workspace has been created successfully.`
      })

      // Reset form and close dialog
      setName('')
      setDescription('')
      onOpenChange(false)
      
      // Notify parent to refresh
      onWorkspaceCreated?.()
      
      // Refresh the page to show new workspace
      window.location.reload()
    } catch (error) {
      console.error('Error creating workspace:', error)
      toast({
        title: 'Error',
        description: 'Failed to create workspace. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Create a workspace</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp, Marketing Team"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description (optional)</Label>
            <Textarea
              id="workspace-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this workspace for?"
              rows={3}
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
              {isLoading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}