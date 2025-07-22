import React from 'react'

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-slack-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-foreground">Loading Slack Clone...</h2>
        <p className="text-sm text-muted-foreground mt-2">Setting up your workspace</p>
      </div>
    </div>
  )
}