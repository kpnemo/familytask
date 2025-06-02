const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testApiLogic() {
  try {
    console.log('Testing API logic for phone number visibility...\n')
    
    // Find the user me@mikebog.com
    const user = await prisma.user.findUnique({
      where: { email: 'me@mikebog.com' }
    })
    
    if (!user) {
      console.log('User me@mikebog.com not found')
      return
    }
    
    console.log(`User found: ${user.name} (${user.email})`)
    console.log(`User role: ${user.role}`)
    console.log(`User phone: ${user.phoneNumber}`)
    
    // Get their family membership
    const currentUserMembership = await prisma.familyMember.findFirst({
      where: { userId: user.id }
    })
    
    if (!currentUserMembership) {
      console.log('No family membership found')
      return
    }
    
    console.log(`\nFamily membership role: ${currentUserMembership.role}`)
    
    // Check if user is parent
    const isParent = ["PARENT", "ADMIN_PARENT"].includes(currentUserMembership.role)
    console.log(`Is parent (can see phone numbers): ${isParent}`)
    
    // Create user select object like the API does
    const userSelect = {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      ...(isParent ? { phoneNumber: true } : {})
    }
    
    console.log('\nUser select object:')
    console.log(userSelect)
    
    // Simulate the API call
    const familyMember = await prisma.familyMember.findFirst({
      where: { userId: user.id },
      include: {
        family: {
          include: {
            members: {
              include: {
                user: {
                  select: userSelect
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
      console.log('No family found')
      return
    }
    
    console.log('\n=== API Response (what the client receives) ===')
    console.log(JSON.stringify({
      success: true,
      data: familyMember.family.members
    }, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testApiLogic()
