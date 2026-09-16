import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminUsername || !adminPassword) {
    console.log('Skipping admin seed: ADMIN_USERNAME or ADMIN_PASSWORD not set in env.')
    return
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  })

  const passwordHash = await bcrypt.hash(adminPassword, 10)

  if (existingAdmin) {
    await prisma.user.update({
      where: { username: adminUsername },
      data: { role: 'ADMIN', passwordHash },
    })
    console.log('Updated existing admin user.')
  } else {
    await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash,
        role: 'ADMIN',
      },
    })
    console.log('Created new admin user.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
