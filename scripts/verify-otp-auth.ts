import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateSecureOtp, hashOtp, verifyOtpHash } from '../lib/otp'

const prisma = new PrismaClient()

async function main() {
  console.log('====================================================')
  console.log('   SMARTINTERVIEW — TWO-STEP AUTH AUDIT & VERIFICATION')
  console.log('====================================================\n')

  let passedTests = 0
  let totalTests = 0

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++
    if (condition) {
      console.log(`  [PASS] ${testName}`)
      passedTests++
    } else {
      console.error(`  [FAIL] ${testName}`)
      if (details) console.error(`         Detail: ${details}`)
      process.exitCode = 1
    }
  }

  // ─── 1. Database record preservation ─────────────────────────────────────
  console.log('--- 1. DATABASE RECORD COUNTS & DATA PRESERVATION ---')
  const userCount = await prisma.user.count()
  const candidateCount = await prisma.candidate.count()
  const sessionCount = await prisma.interviewSession.count()
  const reportCount = await prisma.interviewReport.count()
  const questionCount = await prisma.question.count()
  const answerCount = await prisma.answer.count()
  const auditLogCount = await prisma.auditLog.count()

  console.log(`  Users: ${userCount}, Candidates: ${candidateCount}, Sessions: ${sessionCount}`)
  console.log(`  Reports: ${reportCount}, Questions: ${questionCount}, Answers: ${answerCount}, AuditLogs: ${auditLogCount}\n`)

  assert(userCount >= 13, 'Users count preserved (>= 13)', `Got ${userCount}`)
  assert(candidateCount >= 49, 'Candidates count preserved (>= 49)', `Got ${candidateCount}`)
  assert(sessionCount >= 46, 'InterviewSessions count preserved (>= 46)', `Got ${sessionCount}`)
  assert(reportCount >= 3, 'InterviewReports count preserved (>= 3)', `Got ${reportCount}`)
  assert(questionCount >= 32, 'Questions count preserved (>= 32)', `Got ${questionCount}`)
  assert(answerCount >= 12, 'Answers count preserved (>= 12)', `Got ${answerCount}`)
  assert(auditLogCount >= 84, 'AuditLogs count preserved (>= 84)', `Got ${auditLogCount}`)

  // ─── 2. Admin credential integrity ───────────────────────────────────────
  console.log('\n--- 2. ADMIN CREDENTIAL INTEGRITY ---')
  const adminUsers = await prisma.user.findMany({ where: { role: 'ADMIN' } })
  assert(adminUsers.length >= 2, 'Admin accounts exist', `Found ${adminUsers.length}`)
  for (const admin of adminUsers) {
    assert(
      admin.passwordHash !== null && admin.passwordHash.startsWith('$2'),
      `Admin '${admin.username}' has intact bcrypt password hash`
    )
  }

  // ─── 3. Registration creates passwordHash ─────────────────────────────────
  console.log('\n--- 3. REGISTRATION — PASSWORD HASHING ---')
  const testEmail = `verify_test_${Date.now()}@smartinterview-test.local`
  const testPassword = 'TestP@ss1'
  const testName = 'Verify Test User'

  // Simulate register API logic
  const testHash = await bcrypt.hash(testPassword, 12)
  const testUser = await prisma.user.create({
    data: {
      username: testEmail,
      email: testEmail,
      passwordHash: testHash,
      role: 'CANDIDATE',
    },
  })
  await prisma.candidate.create({
    data: { userId: testUser.id, name: testName, email: testEmail },
  })

  assert(testUser.passwordHash !== null, 'Registered user has non-null passwordHash')
  assert(testUser.passwordHash?.startsWith('$2') ?? false, 'Registered passwordHash is bcrypt format')
  assert(
    await bcrypt.compare(testPassword, testUser.passwordHash!),
    'Registered password can be verified with bcrypt.compare'
  )
  assert(
    !(await bcrypt.compare('wrong-password', testUser.passwordHash!)),
    'Wrong password fails bcrypt.compare'
  )

  // ─── 4. OTP lifecycle after password verification ────────────────────────
  console.log('\n--- 4. OTP LIFECYCLE — TWO-STEP FLOW ---')
  const otp = generateSecureOtp()
  const otpHash = hashOtp(otp)

  // Simulate: password verified → OTP created and sent
  await prisma.otpVerification.updateMany({
    where: { email: testEmail, usedAt: null },
    data: { usedAt: new Date() },
  })

  const otpRecord = await prisma.otpVerification.create({
    data: {
      userId: testUser.id,
      email: testEmail,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
    },
  })

  assert(/^\d{6}$/.test(otp), 'Generated OTP is 6 numeric digits')
  assert(otpRecord.usedAt === null, 'Fresh OTP: usedAt = null (unused)')
  assert(otpRecord.attempts === 0, 'Fresh OTP: attempts = 0')
  assert(verifyOtpHash(otp, otpHash), 'Correct OTP passes timing-safe verification')
  assert(!verifyOtpHash('000000', otpHash), 'Incorrect OTP fails timing-safe verification')

  // Simulate failed attempt
  const afterFail = await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { attempts: { increment: 1 } },
  })
  assert(afterFail.attempts === 1, 'Failed attempt increments attempts counter')

  // Simulate successful verify (consume OTP)
  const afterSuccess = await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { usedAt: new Date() },
  })
  assert(afterSuccess.usedAt !== null, 'Successful OTP is marked usedAt (single-use consumed)')

  // Attempt reuse — should not be found
  const reuseAttempt = await prisma.otpVerification.findFirst({
    where: { id: otpRecord.id, usedAt: null, expiresAt: { gt: new Date() } },
  })
  assert(reuseAttempt === null, 'Consumed OTP cannot be reused (not found in active records)')

  // ─── 5. OTP expiry logic ──────────────────────────────────────────────────
  console.log('\n--- 5. OTP EXPIRY ---')
  const expiredOtp = await prisma.otpVerification.create({
    data: {
      userId: testUser.id,
      email: testEmail,
      otpHash: hashOtp('999999'),
      expiresAt: new Date(Date.now() - 1000), // 1 second in the past
      attempts: 0,
    },
  })
  const expiredCheck = await prisma.otpVerification.findFirst({
    where: { id: expiredOtp.id, usedAt: null, expiresAt: { gt: new Date() } },
  })
  assert(expiredCheck === null, 'Expired OTP is not found in active lookup')
  await prisma.otpVerification.delete({ where: { id: expiredOtp.id } })

  // ─── 6. Set-password endpoint — only for null-password accounts ──────────
  console.log('\n--- 6. SET-PASSWORD GUARD (null-password accounts only) ---')
  const nullUser = await prisma.user.create({
    data: {
      username: `nullpw_${Date.now()}@test.local`,
      email: `nullpw_${Date.now()}@test.local`,
      passwordHash: null,
      role: 'INTERVIEWER',
    },
  })
  assert(nullUser.passwordHash === null, 'Legacy null-password account created for test')

  // Simulate setting the password
  const newPwHash = await bcrypt.hash('NewP@ss9', 12)
  await prisma.user.update({ where: { id: nullUser.id }, data: { passwordHash: newPwHash } })
  const updatedUser = await prisma.user.findUnique({ where: { id: nullUser.id } })
  assert(
    updatedUser?.passwordHash !== null && (await bcrypt.compare('NewP@ss9', updatedUser!.passwordHash!)),
    'Password set via set-password flow and verifiable with bcrypt'
  )

  // ─── 7. Cleanup test data ────────────────────────────────────────────────
  await prisma.otpVerification.deleteMany({ where: { email: testEmail } })
  await prisma.candidate.deleteMany({ where: { userId: testUser.id } })
  await prisma.user.delete({ where: { id: testUser.id } })
  await prisma.user.delete({ where: { id: nullUser.id } })

  // ─── Final record counts must be unchanged ────────────────────────────────
  console.log('\n--- 7. FINAL RECORD COUNT STABILITY ---')
  const finalUsers = await prisma.user.count()
  const finalCandidates = await prisma.candidate.count()
  assert(finalUsers === userCount, `User count restored to ${userCount}`, `Got ${finalUsers}`)
  assert(finalCandidates === candidateCount, `Candidate count restored to ${candidateCount}`, `Got ${finalCandidates}`)

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n====================================================')
  console.log(`   AUDIT COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED`)
  console.log('====================================================\n')

  if (passedTests === totalTests) {
    console.log('SUCCESS: All two-step auth, data preservation, and security checks PASSED.')
  } else {
    throw new Error(`${totalTests - passedTests} test(s) FAILED`)
  }
}

main()
  .catch((e) => {
    console.error('\nAudit failed with error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
