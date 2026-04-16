import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db'
import studentRoutes from './routes/students'
import teacherRoutes from './routes/teachers'
import subjectRoutes from './routes/subjects'
import resultRoutes from './routes/results'
import authRoutes from './routes/auth'
import attendanceRoutes from './routes/attendance'
import configRoutes from './routes/config'
import observationRoutes from './routes/observations'
import notificationRoutes from './routes/notifications'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/teachers', teacherRoutes)
app.use('/api/subjects', subjectRoutes)
app.use('/api/results', resultRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/config', configRoutes)
app.use('/api/observations', observationRoutes)
app.use('/api/notifications', notificationRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

async function startServer() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

startServer()