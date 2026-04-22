import type { Handler } from '@netlify/functions'
import serverlessHttp from 'serverless-http'
import app from '../../server/src/index'

const serverlessApp = serverlessHttp(app)

export const handler: Handler = async (event, context) => {
  return serverlessApp(event, context) as any
}
