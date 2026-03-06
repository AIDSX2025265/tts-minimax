import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function POST(req: Request) {
  // 检查登录状态
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-prod' })
  
  if (!token) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { text } = await req.json()

  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }

  try {
    const apiKey = process.env.MINIMAX_API_KEY || 'sk-api-RSMASEzZAkfj43fn24VlWIi9s28UBbiNjacQv3eZiaBbqYFdOqRucrRhuN8-AwfIC4HT8sFrxwzYfgvTzA-sgNE9FiziHkviKXtk39jTU88ulXifCMTvCXM'
    const groupId = process.env.MINIMAX_GROUP_ID || '1810540818335809757'
    
    const response = await fetch(`https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'speech-2.6-hd',
        text: text,
        voice_setting: {
          voice_id: process.env.MINIMAX_VOICE_ID || 'achuan_voice_003',
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
      return NextResponse.json({ error: data.base_resp?.status_msg || 'TTS error', details: data }, { status: 500 })
    }

    const audioHex = data.data?.audio
    if (!audioHex) {
      return NextResponse.json({ error: 'No audio returned', details: data }, { status: 500 })
    }

    // hex 转 base64
    const audioBuffer = Buffer.from(audioHex, 'hex')
    const audioBase64 = audioBuffer.toString('base64')
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`

    return NextResponse.json({
      audio_url: audioUrl,
      success: true
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
