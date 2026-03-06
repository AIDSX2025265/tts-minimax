import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text } = await req.json()

  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }

  try {
    const apiKey = process.env.MINIMAX_API_KEY
    const voiceId = process.env.MINIMAX_VOICE_ID || 'male-qn-qingse'
    
    const response = await fetch('https://api.minimax.chat/v1/t2a', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'speech-02-turbo',
        text: text,
        voice_setting: {
          voice_id: voiceId
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3'
        }
      }),
    })

    const data = await response.json()

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json({ error: data.base_resp?.status_msg || 'TTS error' }, { status: 500 })
    }

    return NextResponse.json({
      audio_url: data.data?.audio,
      duration: data.data?.audio_size
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
