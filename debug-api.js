const { PrismaClient } = require('@prisma/client')

async function debugApiIssue() {
  const prisma = new PrismaClient()
  
  try {
    console.log('=== DEBUGGING API ISSUE ===\n')
    
    // 1. Find your user
    const user = await prisma.user.findUnique({
      where: { email: 'me@mikebog.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true
      }
    })
    
    console.log('1. Your user from database:')
    console.log(user)
    
    // 2. Get family membership
    const membership = await prisma.familyMember.findFirst({
      where: { userId: user.id }
    })
    
    console.log('\n2. Your family membership:')
    console.log(membership)
    
    // 3. Test the exact logic from the API
    const isParent = ["PARENT", "ADMIN_PARENT"].includes(membership.role)
    console.log(`\n3. Is parent check: ${isParent}`)
    
    // 4. Create user select object exactly like API
    const userSelect = {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      ...(isParent ? { phoneNumber: true } : {})
    }
    
    console.log('\n4. User select object:')
    console.log(JSON.stringify(userSelect, null, 2))
    
    // 5. Test the query exactly like API
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
    
    console.log('\n5. Full API query result:')
    console.log(JSON.stringify(familyMember.family.members, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugApiIssue()
