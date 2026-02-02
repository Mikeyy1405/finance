import { prisma } from './db'

/**
 * Get the household for a user (returns the first household they belong to)
 */
export async function getUserHousehold(userId: string) {
  const membership = await prisma.householdMember.findFirst({
    where: { userId },
    include: {
      household: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  })
  return membership?.household ?? null
}

/**
 * Get all user IDs in the same household as the given user.
 * If user has no household, returns only their own ID.
 */
export async function getHouseholdMemberIds(userId: string): Promise<string[]> {
  const household = await getUserHousehold(userId)
  if (!household) return [userId]
  return household.members.map((m) => m.user.id)
}

/**
 * Get household members with their details
 */
export async function getHouseholdMembers(userId: string) {
  const household = await getUserHousehold(userId)
  if (!household) return []
  return household.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
  }))
}

/**
 * Check if a user is in the same household as another user
 */
export async function isInSameHousehold(userId1: string, userId2: string): Promise<boolean> {
  const memberIds = await getHouseholdMemberIds(userId1)
  return memberIds.includes(userId2)
}
