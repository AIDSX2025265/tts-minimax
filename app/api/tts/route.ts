import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { text, voice, emotion, speed } = body
  if (!text) {
    return NextResponse.json({ error: '请输入文字' }, { status: 400 })
  }

  const apiKey = 'sk-api-RSMASEzZAkfj43fn24VlWIi9s28UBbiNjacQv3eZiaBbqYFdOqRucrRhuN8-AwfIC4HT8sFrxwzYfgvTzA-sgNE9FiziHkviKXtk39jTU88ulXifCMTvCXM'
  const groupId = '1810540818335809757'
  const voiceId = voice || 'achuan_voice_003'

  const voiceSetting: any = {
    voice_id: voiceId,
    speed: speed || 1,
    pitch: 0,
    vol: 1
  }
  
  // 添加情感参数
  if (emotion) {
    voiceSetting.emotion = emotion
  }

  const payload = {
    model: 'speech-2.6-hd',
    text: String(text).slice(0, 1000),
    voice_setting: voiceSetting,
    audio_setting: {
      sample_rate: 44100,
      bitrate: 128000,
      format: 'mp3'
    }
  }

  try {
    const response = await fetch('https://api.minimax.chat/v1/t2a_v2?GroupId=' + groupId, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.base_resp && data.base_resp.status_code !== 0) {
      return NextResponse.json({ error: data.base_resp.status_msg || 'API错误' }, { status: 500 })
    }

    const audioHex = data.data && data.data.audio
    if (!audioHex) {
      return NextResponse.json({ error: '没有生成音频' }, { status: 500 })
    }

    const buffer = Buffer.from(audioHex, 'hex')
    const base64 = buffer.toString('base64')
    const audioUrl = 'data:audio/mp3;base64,' + base64

    return NextResponse.json({ audio_url: audioUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
