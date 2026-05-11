
import nodemailer from 'nodemailer'

const testEmail = async (pass: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'folushovictoryschool@gmail.com',
      pass: pass,
    },
  })

  try {
    await transporter.verify()
    console.log(`SUCCESS with password: ${pass}`)
    return true
  } catch (error) {
    console.log(`FAILED with password: ${pass}`)
    return false
  }
}

const runTests = async () => {
  console.log('Testing email passwords...')
  await testEmail('kewv hcfl ssxw nauf')
  await testEmail('fvvv lyzz hdsd aupi')
}

runTests()
