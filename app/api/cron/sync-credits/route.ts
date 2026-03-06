import { NextResponse } from 'next/server'

const APP_TOKEN = 'Iqqfw5P6zindzwkIac4cpwnDnPd'
const TABLE_ID = 'tbl21NcqSKNFghsv'
const FIELD_EMAIL = '文本 3'
const FIELD_CREDITS = '积分'

const APP_ID = 'cli_a915a54f0a789cb3'
const APP_SECRET = 'XSqaFJZx1Yeie4mwaeNV9Ho6FoaFp0bK'

let cachedToken: string | null = null
let tokenExpire = 0

async function getAccessToken() {
  const now = Date.now()
  if (cachedToken && tokenExpire > now + 300000) {
    return cachedToken
  }
  
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
  })
  const data = await res.json()
  if (data.tenant_access_token) {
    cachedToken = data.tenant_access_token
    tokenExpire = now + (data.expire - 300) * 1000
    return cachedToken
  }
  throw new Error('Failed to get access token')
}

async function queryUsers() {
  const token = await getAccessToken()
  const res = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=100`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  const data = await res.json()
  return data.data?.records || []
}

async function updateCredits(recordId: string, credits: number) {
  const token = await getAccessToken()
  await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/${recordId}`, {
    method: 'PUT',
    headers: { 
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: { [FIELD_CREDITS]: credits }
    })
  })
}

export async function GET() {
  try {
    const records = await queryUsers()
    let newUsers = 0
    
    for (const record of records) {
      const email = record.fields[FIELD_EMAIL]
      const credits = record.fields[FIELD_CREDITS]
      
      if (email && (credits === null || credits === undefined || credits === 0)) {
        await updateCredits(record.record_id, 10000)
        newUsers++
        console.log(`Added 10000 credits to new user: ${email}`)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `检查完成，新增用户: ${newUsers}`,
      totalUsers: records.length
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
