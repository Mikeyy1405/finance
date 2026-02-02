import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, verifyPassword } from '@/lib/auth'

// GET: list collaborators for the current user (people I share with)
export async function GET() {
  try {
    const user = await requireAuth()

    const collaborators = await prisma.collaborator.findMany({
      where: { ownerId: user.id },
      include: { collaborator: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    // Also get administrations shared with me
    const sharedWithMe = await prisma.collaborator.findMany({
      where: { collaboratorId: user.id },
      include: { owner: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ collaborators, sharedWithMe })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST: add a collaborator by email + password verification
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email en wachtwoord zijn verplicht' }, { status: 400 })
    }

    // Verify the current user's password for security
    const currentUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!currentUser) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
    }
    const valid = await verifyPassword(password, currentUser.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Ongeldig wachtwoord' }, { status: 403 })
    }

    // Find the collaborator user by email
    const collaboratorUser = await prisma.user.findUnique({ where: { email } })
    if (!collaboratorUser) {
      return NextResponse.json({ error: 'Geen gebruiker gevonden met dit emailadres' }, { status: 404 })
    }

    if (collaboratorUser.id === user.id) {
      return NextResponse.json({ error: 'Je kunt jezelf niet als collaborator toevoegen' }, { status: 400 })
    }

    // Check if already exists
    const existing = await prisma.collaborator.findUnique({
      where: { ownerId_collaboratorId: { ownerId: user.id, collaboratorId: collaboratorUser.id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Deze gebruiker heeft al toegang' }, { status: 400 })
    }

    const collaborator = await prisma.collaborator.create({
      data: { ownerId: user.id, collaboratorId: collaboratorUser.id },
      include: { collaborator: { select: { id: true, email: true, name: true } } },
    })

    return NextResponse.json(collaborator)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}

// DELETE: remove a collaborator
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { collaboratorId } = await req.json()

    if (!collaboratorId) {
      return NextResponse.json({ error: 'Collaborator ID is verplicht' }, { status: 400 })
    }

    await prisma.collaborator.deleteMany({
      where: { ownerId: user.id, collaboratorId },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
