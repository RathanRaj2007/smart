/**
 * Prisma seed script — creates the demo admin user.
 *
 * Run:  npx tsx prisma/seed.ts
 *   or: npm run db:seed
 *
 * Demo credentials:
 *   Username: admin
 *   Password: Admin@123
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const DEMO_USERNAME = 'admin'
  const DEMO_PASSWORD = 'Admin@123'

  const existing = await prisma.user.findUnique({ where: { username: DEMO_USERNAME } })

  if (existing) {
    console.log(`ℹ️  Seed user "${DEMO_USERNAME}" already exists — skipping.`)
    return
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  const user = await prisma.user.create({
    data: {
      username: DEMO_USERNAME,
      passwordHash,
    },
  })

  console.log(`✅ Seed user created: id=${user.id}, username="${user.username}"`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
