import { prisma } from './db'

/**
 * Returns all user IDs whose data the given user can access:
 * their own ID + the IDs of any owners who added them as collaborator.
 */
export async function getAccessibleUserIds(userId: string): Promise<string[]> {
  const collabs = await prisma.collaborator.findMany({
    where: { collaboratorId: userId },
    select: { ownerId: true },
  })
  return [userId, ...collabs.map(c => c.ownerId)]
}
