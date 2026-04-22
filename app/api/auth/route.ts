import { NextResponse } from 'next/server'

const APP_TOKEN = process.env.FEISHU_APP_TOKEN || 'Iqqfw5P6zindzwkIac4cpwnDnPd'
const TABLE_ID = process.env.FEISHU_TABLE_ID || 'tbl21NcqSKNFghsv'
const FIELD_EMAIL = '邮箱'
const FIELD_PASSWORD = '密码'
const FIELD_NAME = '账号名'
const FIELD_CREDITS = '积分'

const APP_ID = process.env.FEISHU_APP_ID
const APP_SECRET = process.env.FEISHU_APP_SECRET

let cachedToken: string | null = null
let tokenExpire = 0

// 处理飞书字段值（可能是字符串或数组格式）
function extractFieldValue(field: any): string {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (Array.isArray(field) && field.length > 0) {
    if (field[0]?.text) return field[0].text
    return String(field[0])
  }
  return String(field)
}

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
  return data.data?.items || []
}

async function updateUserCredits(recordId: string, credits: number) {
  const token = await getAccessToken()
  await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/${recordId}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: { [FIELD_CREDITS]: credits } })
  })
}

export async function POST(req: Request) {
  const { action, email, password, credits } = await req.json()

  try {
    if (action === 'getCredits') {
      const records = await queryUsers()
      const user = records.find((r: any) =>
        extractFieldValue(r.fields[FIELD_EMAIL]).trim().toLowerCase() === email.trim().toLowerCase()
      )
      if (user) {
        return NextResponse.json({ credits: Number(extractFieldValue(user.fields[FIELD_CREDITS])) || 0 })
      }
      return NextResponse.json({ credits: 0 })
    }

    if (action === 'deductCredits') {
      const records = await queryUsers()
      const user = records.find((r: any) =>
        extractFieldValue(r.fields[FIELD_EMAIL]).trim().toLowerCase() === email.trim().toLowerCase()
      )
      if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 400 })

      const currentCredits = Number(extractFieldValue(user.fields[FIELD_CREDITS])) || 0
      const deductAmount = Number(credits)
      if (currentCredits < deductAmount) {
        return NextResponse.json({ error: '积分不足', credits: currentCredits }, { status: 400 })
      }

      const newCredits = currentCredits - deductAmount
      await updateUserCredits(user.record_id, newCredits)
      return NextResponse.json({ success: true, credits: newCredits })
    }

    if (action === 'addCredits') {
      const records = await queryUsers()
      const user = records.find((r: any) =>
        extractFieldValue(r.fields[FIELD_EMAIL]).trim().toLowerCase() === email.trim().toLowerCase()
      )
      if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 400 })

      const currentCredits = Number(extractFieldValue(user.fields[FIELD_CREDITS])) || 0
      const newCredits = currentCredits + Number(credits)
      await updateUserCredits(user.record_id, newCredits)
      return NextResponse.json({ success: true, credits: newCredits })
    }

    if (action === 'listUsers') {
      const records = await queryUsers()
      const users = records.map((r: any) => ({
        email: extractFieldValue(r.fields[FIELD_EMAIL]),
        name: extractFieldValue(r.fields[FIELD_NAME]),
        credits: Number(extractFieldValue(r.fields[FIELD_CREDITS])) || 0
      }))
      return NextResponse.json({ users })
    }

    if (action === 'debugFeishu') {
      const records = await queryUsers()
      return NextResponse.json({
        total: records.length,
        fields: records.length > 0 ? Object.keys(records[0].fields) : [],
        sample: records.length > 0 ? {
          record_id: records[0].record_id,
          fields: records[0].fields
        } : null
      })
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
