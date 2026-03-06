'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('两次密码输入不一致')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('密码至少6位')
        setLoading(false)
        return
      }
      // 注册新用户，赠送10000积分
      const users = JSON.parse(localStorage.getItem('tts_users') || '[]')
      if (users.find((u: any) => u.email === email)) {
        setError('该邮箱已注册')
        setLoading(false)
        return
      }
      users.push({ email, password, credits: 10000 })
      localStorage.setItem('tts_users', JSON.stringify(users))
      // 自动登录
      const result = await signIn('credentials', { email, password, register: 'true', redirect: false })
      if (result?.ok) router.push('/')
      else setError('注册失败')
    } else {
      // 登录验证
      const users = JSON.parse(localStorage.getItem('tts_users') || '[]')
      const user = users.find((u: any) => u.email === email && u.password === password)
      if (!user) {
        // 测试账号
        if (email === 'test@example.com' && password === 'password123') {
          const result = await signIn('credentials', { email, password, redirect: false })
          if (result?.ok) router.push('/')
          else setError('登录失败')
        } else {
          setError('邮箱或密码错误')
        }
      } else {
        const result = await signIn('credentials', { email, password, redirect: false })
        if (result?.ok) router.push('/')
        else setError('登录失败')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/20">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">{isRegister ? '创建账号' : '欢迎回来'}</h1>
          <p className="text-green-400">{isRegister ? '注册送10000积分' : '登录你的账号'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-green-400 text-sm mb-2">邮箱</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-black/30 border border-green-700/30 rounded-xl text-white placeholder-green-600/50 focus:outline-none focus:border-green-500 transition"
              required
            />
          </div>
          
          <div>
            <label className="block text-green-400 text-sm mb-2">密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-black/30 border border-green-700/30 rounded-xl text-white placeholder-green-600/50 focus:outline-none focus:border-green-500 transition"
              required
              minLength={6}
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-green-400 text-sm mb-2">确认密码</label>
              <input
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-4 bg-black/30 border border-green-700/30 rounded-xl text-white placeholder-green-600/50 focus:outline-none focus:border-green-500 transition"
                required={isRegister}
                minLength={6}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white rounded-xl font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
          >
            {loading ? '处理中...' : (isRegister ? '注册并登录' : '登录')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-green-400 hover:text-green-300 text-sm transition"
          >
            {isRegister ? '已有账号？登录' : '没有账号？注册'}
          </button>
        </div>

        {!isRegister && (
          <div className="mt-6 p-4 bg-green-900/30 border border-green-700/30 rounded-xl">
            <p className="text-green-400 text-sm text-center mb-2">💡 提示</p>
            <p className="text-green-500 text-xs text-center">新用户注册赠送10000积分</p>
            <p className="text-green-500 text-xs text-center">1000字消耗约¥0.07</p>
          </div>
        )}

        <button 
          onClick={() => router.push('/')} 
          className="w-full mt-4 py-3 text-green-600 hover:text-green-500 text-sm transition"
        >
          ← 返回首页
        </button>
      </div>
    </div>
  )
}
