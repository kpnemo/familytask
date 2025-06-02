const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPhoneNumbers() {
  try {
    console.log('Testing phone number feature...\n')
    
    // Check users with phone numbers
    console.log('1. Users with phone numbers:')
    const usersWithPhones = await prisma.user.findMany({
      where: {
        phoneNumber: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true
      }
    })
    console.log(usersWithPhones)
    
    console.log('\n2. Testing API logic (parent can see phone numbers):')
    
    // Find a parent user
    const parentUser = await prisma.user.findFirst({
      where: {
        role: 'PARENT'
      }
    })
    
    if (!parentUser) {
      console.log('No parent user found')
      return
    }
    
    console.log(`Parent user: ${parentUser.name} (${parentUser.email})`)
    
    // Get their family membership
    const familyMember = await prisma.familyMember.findFirst({
      where: { userId: parentUser.id },
      include: {
        family: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    phoneNumber: true // This should work for parents
                  }
                }
              },
              orderBy: [
                { role: 'asc' },
                { joinedAt: 'asc' }
              ]
            }
          }
        }
      }
    })
    
    if (!familyMember) {
      console.log('Parent has no family membership')
      return
    }
    
    console.log('\n3. Family members with phone numbers (as seen by parent):')
    familyMember.family.members.forEach(member => {
      console.log(`- ${member.user.name} (${member.user.email}): ${member.user.phoneNumber || 'No phone'}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPhoneNumbers()
