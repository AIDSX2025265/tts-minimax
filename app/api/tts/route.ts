import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-prod' })
  
  if (!token) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { text } = body
  if (!text) {
    return NextResponse.json({ error: '请输入文字' }, { status: 400 })
  }

  const apiKey = process.env.MINIMAX_API_KEY || 'sk-api-RSMASEzZAkfj43fn24VlWIi9s28UBbiNjacQv3eZiaBbqYFdOqRucrRhuN8-AwfIC4HT8sFrxwzYfgvTzA-sgNE9FiziHkviKXtk39jTU88ulXifCMTvCXM'
  const groupId = process.env.MINIMAX_GROUP_ID || '1810540818335809757'
  const voiceId = process.env.MINIMAX_VOICE_ID || 'achuan_voice_003'

  try {
    const response = await fetch(`https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'speech-2.6-hd',
        text: text.slice(0, 1000), // 限制长度
        voice_setting: {
          voice_id: voiceId,
          speed: 1,
          pitch: 0,
          vol: 1
        },
        audio_setting: {
          sample_rate: 44100,
          bitrate: 128000,
          format: 'mp3'
        }
      }),
    })

    const data = await response.json()

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json({ error: data.base_resp?.status_msg || 'API错误', details: data }, { status: 500 })
    }

    const audioHex = data.data?.audio
    if (!audioHex) {
      return NextResponse.json({ error: '没有生成音频', details: data }, { status: 500 })
    }

    // 使用 Buffer 转换
    const buffer = Buffer.from(audioHex, 'hex')
    const base64 = buffer.toString('base64')
    const audioUrl = `data:audio/mp3;base64,${base64}`

    return NextResponse.json({ audio_url: audioUrl, success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
