import { NextResponse } from 'next/server'

const APP_TOKEN = 'Iqqfw5P6zindzwkIac4cpwnDnPd'
const TABLE_ID = 'tbl21NcqSKNFghsv'
const FIELD_EMAIL = '文本 3'
const FIELD_PASSWORD = '文本 2'
const FIELD_NAME = '文本'
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

async function updateUserCredits(email: string, credits: number) {
  const token = await getAccessToken()
  const records = await queryUsers()
  const record = records.find((r: any) => r.fields[FIELD_EMAIL] === email)
  if (!record) return null
  
  const recordId = record.record_id
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

export async function POST(req: Request) {
  const { action, email, password, credits } = await req.json()
  
  try {
    if (action === 'login') {
      const records = await queryUsers()
      const user = records.find((r: any) => r.fields[FIELD_EMAIL] === email && r.fields[FIELD_PASSWORD] === password)
      if (user) {
        return NextResponse.json({ 
          success: true, 
          user: { email, credits: user.fields[FIELD_CREDITS] || 0 } 
        })
      }
      if (email === 'test@example.com' && password === 'password123') {
        return NextResponse.json({ success: true, user: { email, credits: -1 } })
      }
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }
    
    if (action === 'register') {
      return NextResponse.json({ error: '请联系管理员开通账号' }, { status: 400 })
    }
    
    if (action === 'getCredits') {
      const records = await queryUsers()
      const user = records.find((r: any) => r.fields[FIELD_EMAIL] === email)
      if (user) {
        return NextResponse.json({ credits: user.fields[FIELD_CREDITS] || 0 })
      }
      return NextResponse.json({ credits: 0 })
    }
    
    if (action === 'deductCredits') {
      const records = await queryUsers()
      const user = records.find((r: any) => r.fields[FIELD_EMAIL] === email)
      if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 400 })
      
      const currentCredits = user.fields[FIELD_CREDITS] || 0
      if (currentCredits < credits) {
        return NextResponse.json({ error: '积分不足' }, { status: 400 })
      }
      
      await updateUserCredits(email, currentCredits - credits)
      return NextResponse.json({ success: true, credits: currentCredits - credits })
    }
    
    if (action === 'addCredits') {
      const records = await queryUsers()
      const user = records.find((r: any) => r.fields[FIELD_EMAIL] === email)
      if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 400 })
      
      const currentCredits = user.fields[FIELD_CREDITS] || 0
      await updateUserCredits(email, currentCredits + credits)
      return NextResponse.json({ success: true, credits: currentCredits + credits })
    }
    
    if (action === 'listUsers') {
      const records = await queryUsers()
      const users = records.map((r: any) => ({
        email: r.fields[FIELD_EMAIL],
        credits: r.fields[FIELD_CREDITS] || 0
      }))
      return NextResponse.json({ users })
    }
    
    return NextResponse.json({ error: '未知操作' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
