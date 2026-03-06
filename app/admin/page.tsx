'use client'

import { useState, useEffect } from 'react'

interface User {
  email: string
  password: string
  credits: number
}

interface RedeemCode {
  code: string
  credits: number
  used: boolean
  usedBy?: string
  createdAt: string
}

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [codes, setCodes] = useState<RedeemCode[]>([])
  const [newCodeCount, setNewCodeCount] = useState(1)
  const [tab, setTab] = useState<'users' | 'codes'>('users')
  const [targetEmail, setTargetEmail] = useState('')
  const [rechargeAmount, setRechargeAmount] = useState(1000)
  const [showWechat, setShowWechat] = useState(false)

  useEffect(() => {
    const savedUsers = localStorage.getItem('tts_users')
    if (savedUsers) setUsers(JSON.parse(savedUsers))
    
    const savedCodes = localStorage.getItem('tts_redeem_codes')
    if (savedCodes) setCodes(JSON.parse(savedCodes))
  }, [])

  const login = () => {
    if (adminPassword === 'admin123') {
      setIsAdmin(true)
    } else {
      alert('管理员密码错误')
    }
  }

  const generateCodes = () => {
    const newCodes: RedeemCode[] = []
    for (let i = 0; i < newCodeCount; i++) {
      const code = 'TTS' + Math.random().toString(36).substring(2, 8).toUpperCase() + Date.now().toString().slice(-4)
      newCodes.push({ code, credits: 10000, used: false, createdAt: new Date().toISOString() })
    }
    const allCodes = [...codes, ...newCodes]
    setCodes(allCodes)
    localStorage.setItem('tts_redeem_codes', JSON.stringify(allCodes))
    alert(`生成 ${newCodeCount} 个兑换码成功！`)
  }

  const rechargeUser = () => {
    if (!targetEmail) return alert('请输入用户邮箱')
    const allUsers = JSON.parse(localStorage.getItem('tts_users') || '[]')
    const userIndex = allUsers.findIndex((u: User) => u.email === targetEmail)
    if (userIndex >= 0) {
      allUsers[userIndex].credits = (allUsers[userIndex].credits || 0) + rechargeAmount
      setUsers(allUsers)
      localStorage.setItem('tts_users', JSON.stringify(allUsers))
      alert(`给 ${targetEmail} 充值 ${rechargeAmount} 积分成功！`)
    } else {
      alert('用户不存在')
    }
  }

  const deleteUser = (email: string) => {
    if (!confirm(`确定删除用户 ${email} 吗？`)) return
    const allUsers = users.filter(u => u.email !== email)
    setUsers(allUsers)
    localStorage.setItem('tts_users', JSON.stringify(allUsers))
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-white text-center mb-6">管理员登录</h1>
            <input
              type="password"
              placeholder="管理员密码"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full p-4 bg-white border border-gray-300 rounded-xl text-white placeholder-green-600/50 focus:outline-none focus:border-green-500 mb-4"
            />
            <button onClick={login} className="w-full py-4 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl font-medium">
              登录
            </button>
            <p className="text-gray-700 text-xs text-center mt-4">默认密码: admin123</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">管理后台</h1>
          <div className="flex gap-4">
            <button onClick={() => setShowWechat(!showWechat)} className="px-4 py-2 bg-green-600 text-white rounded-lg">微信收款码</button>
            <button onClick={() => setIsAdmin(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg">退出</button>
          </div>
        </div>

        {showWechat && (
          <div className="mb-8 p-6 bg-white border border-gray-200 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-4">微信收款码</h2>
            <div className="p-4 bg-white rounded-lg inline-block"><p className="text-gray-800">请添加微信</p></div>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button onClick={() => setTab('users')} className={`px-6 py-3 rounded-lg ${tab === 'users' ? 'bg-green-600 text-white' : 'bg-blue-900/50 text-green-300'}`}>用户管理 ({users.length})</button>
          <button onClick={() => setTab('codes')} className={`px-6 py-3 rounded-lg ${tab === 'codes' ? 'bg-green-600 text-white' : 'bg-blue-900/50 text-green-300'}`}>兑换码管理 ({codes.length})</button>
        </div>

        {tab === 'users' && (
          <div className="space-y-6">
            <div className="p-6 bg-white border border-gray-200 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-4">手动充值</h2>
              <div className="flex gap-4">
                <input type="email" placeholder="用户邮箱" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} className="flex-1 p-3 bg-white border border-gray-300 rounded-xl text-white" />
                <input type="number" placeholder="积分" value={rechargeAmount} onChange={(e) => setRechargeAmount(Number(e.target.value))} className="w-32 p-3 bg-white border border-gray-300 rounded-xl text-white" />
                <button onClick={rechargeUser} className="px-6 py-3 bg-green-600 text-white rounded-xl">充值</button>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-900/50">
                  <tr><th className="p-4 text-left text-white">邮箱</th><th className="p-4 text-left text-white">积分</th><th className="p-4 text-left text-white">操作</th></tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="p-4 text-white">{user.email}</td>
                      <td className="p-4 text-gray-600">{user.credits}</td>
                      <td className="p-4"><button onClick={() => deleteUser(user.email)} className="text-red-400">删除</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'codes' && (
          <div className="space-y-6">
            <div className="p-6 bg-white border border-gray-200 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-4">生成兑换码</h2>
              <div className="flex gap-4">
                <input type="number" placeholder="数量" value={newCodeCount} onChange={(e) => setNewCodeCount(Number(e.target.value))} className="w-32 p-3 bg-white border border-gray-300 rounded-xl text-white" />
                <button onClick={generateCodes} className="px-6 py-3 bg-green-600 text-white rounded-xl">生成 (每个10000积分)</button>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-900/50">
                  <tr><th className="p-4 text-left text-white">兑换码</th><th className="p-4 text-left text-white">积分</th><th className="p-4 text-left text-white">状态</th><th className="p-4 text-left text-white">使用人</th></tr>
                </thead>
                <tbody>
                  {codes.map((code, i) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="p-4 text-gray-600 font-mono">{code.code}</td>
                      <td className="p-4 text-white">{code.credits}</td>
                      <td className="p-4"><span className={code.used ? 'text-red-400' : 'text-gray-600'}>{code.used ? '已使用' : '未使用'}</span></td>
                      <td className="p-4 text-gray-400">{code.usedBy || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
