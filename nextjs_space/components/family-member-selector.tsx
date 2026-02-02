'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'

interface Member {
  id: string
  name: string | null
  email: string
  role: string
}

interface Household {
  id: string
  name: string
  members: Array<{
    id: string
    role: string
    user: { id: string; name: string | null; email: string }
  }>
}

interface FamilyMemberSelectorProps {
  selectedMemberId: string | null
  onSelectMember: (memberId: string | null) => void
}

export function FamilyMemberSelector({
  selectedMemberId,
  onSelectMember,
}: FamilyMemberSelectorProps) {
  const [household, setHousehold] = useState<Household | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [householdRes, meRes] = await Promise.all([
          fetch('/api/household'),
          fetch('/api/auth/me'),
        ])
        if (householdRes.ok) {
          const data = await householdRes.json()
          if (data) setHousehold(data)
        }
        if (meRes.ok) {
          const me = await meRes.json()
          setCurrentUserId(me.id)
        }
      } catch {
        // no household
      }
    }
    load()
  }, [])

  // Don't show selector if no household or only 1 member
  if (!household || household.members.length <= 1) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground mr-1">Gezinslid:</span>
      {household.members.map((member) => {
        const isSelected =
          selectedMemberId === member.user.id ||
          (!selectedMemberId && member.user.id === currentUserId)
        const isMe = member.user.id === currentUserId
        return (
          <button
            key={member.user.id}
            onClick={() => onSelectMember(isMe ? null : member.user.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
              isSelected
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                : 'bg-muted/80 text-muted-foreground hover:bg-muted'
            )}
          >
            {member.user.name || member.user.email.split('@')[0]}
            {isMe && ' (jij)'}
          </button>
        )
      })}
    </div>
  )
}
