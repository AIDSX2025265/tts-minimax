import { NextResponse } from 'next/server'

export async function GET() {
  const APP_ID = process.env.FEISHU_APP_ID;
  const APP_SECRET = process.env.FEISHU_APP_SECRET;
  const APP_TOKEN = process.env.FEISHU_APP_TOKEN;
  const TABLE_ID = process.env.FEISHU_TABLE_ID;

  try {
    // 获取 access token
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
    })
    const tokenData = await tokenRes.json()

    if (!tokenData.tenant_access_token) {
      return NextResponse.json({
        error: 'Failed to get access token',
        details: tokenData
      }, { status: 500 })
    }

    // 查询用户数据
    const res = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=100`,
      { headers: { 'Authorization': 'Bearer ' + tokenData.tenant_access_token } }
    )
    const data = await res.json()

    return NextResponse.json({
      success: true,
      recordCount: data.data?.records?.length || 0,
      records: data.data?.records || [],
      rawResponse: data
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
