import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getUserHousehold } from '@/lib/household'
import { hashPassword } from '@/lib/auth'

// POST: Add a member to the household by email
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json({ error: 'E-mailadres is verplicht' }, { status: 400 })
    }

    const household = await getUserHousehold(user.id)
    if (!household) {
      return NextResponse.json({ error: 'Maak eerst een gezin aan' }, { status: 400 })
    }

    // Check if user is admin
    const membership = household.members.find((m) => m.user.id === user.id)
    if (membership?.role !== 'admin') {
      return NextResponse.json({ error: 'Alleen beheerders kunnen leden toevoegen' }, { status: 403 })
    }

    // Find or create user
    let targetUser = await prisma.user.findUnique({ where: { email } })
    if (!targetUser) {
      // Create a new user account with a temporary password
      const tempPassword = await hashPassword('welkom123')
      targetUser = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash: tempPassword,
        },
      })
    }

    // Check if already a member
    const existingMembership = household.members.find((m) => m.user.id === targetUser!.id)
    if (existingMembership) {
      return NextResponse.json({ error: 'Deze persoon is al lid van het gezin' }, { status: 400 })
    }

    await prisma.householdMember.create({
      data: {
        userId: targetUser.id,
        householdId: household.id,
        role: 'member',
      },
    })

    // Return updated household
    const updated = await getUserHousehold(user.id)
    return NextResponse.json(updated, { status: 201 })
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove a member from the household
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('userId')

    if (!memberId) {
      return NextResponse.json({ error: 'userId is verplicht' }, { status: 400 })
    }

    const household = await getUserHousehold(user.id)
    if (!household) {
      return NextResponse.json({ error: 'Geen gezin gevonden' }, { status: 404 })
    }

    // Check if user is admin (or removing themselves)
    const myMembership = household.members.find((m) => m.user.id === user.id)
    if (myMembership?.role !== 'admin' && memberId !== user.id) {
      return NextResponse.json({ error: 'Alleen beheerders kunnen leden verwijderen' }, { status: 403 })
    }

    // Cannot remove the last admin
    const admins = household.members.filter((m) => m.role === 'admin')
    if (admins.length === 1 && admins[0].user.id === memberId) {
      return NextResponse.json({ error: 'Kan de laatste beheerder niet verwijderen' }, { status: 400 })
    }

    await prisma.householdMember.deleteMany({
      where: {
        userId: memberId,
        householdId: household.id,
      },
    })

    const updated = await getUserHousehold(user.id)
    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
