'use client'

import { useState, useEffect } from 'react'

interface User {
  email: string
  credits: number
}

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [codes, setCodes] = useState<any[]>([])
  const [newCodeCount, setNewCodeCount] = useState(1)
  const [tab, setTab] = useState<'users' | 'codes'>('users')
  const [targetEmail, setTargetEmail] = useState('')
  const [rechargeAmount, setRechargeAmount] = useState(10000)
  const [showWechat, setShowWechat] = useState(false)
  const [loading, setLoading] = useState(false)

  const login = () => {
    if (adminPassword === 'admin123') {
      setIsAdmin(true)
      loadUsers()
    } else {
      alert('管理员密码错误')
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listUsers' })
      })
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (e) {
      console.error('Failed to load users', e)
    }
    setLoading(false)
  }

  const rechargeUser = async () => {
    if (!targetEmail) return alert('请输入用户邮箱')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addCredits', email: targetEmail, credits: rechargeAmount })
      })
      const data = await res.json()
      if (data.success) {
        alert(`给 ${targetEmail} 充值 ${rechargeAmount} 积分成功！`)
        loadUsers()
      } else {
        alert(data.error || '充值失败')
      }
    } catch (e) {
      alert('充值失败')
    }
    setLoading(false)
  }

  const deleteUser = async (email: string) => {
    alert('删除功能待开发')
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">管理员登录</h1>
            <input
              type="password"
              placeholder="管理员密码"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full p-4 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 mb-4"
            />
            <button onClick={login} className="w-full py-4 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl font-medium">
              登录
            </button>
            <p className="text-gray-500 text-xs text-center mt-4">默认密码: admin123</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
          <div className="flex gap-4">
            <button onClick={() => setShowWechat(!showWechat)} className="px-4 py-2 bg-blue-500 text-white rounded-lg">微信收款码</button>
            <button onClick={() => setIsAdmin(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">退出</button>
          </div>
        </div>

        {showWechat && (
          <div className="mb-8 p-6 bg-white border border-gray-200 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">微信收款码</h2>
            <div className="p-4 bg-gray-100 rounded-lg inline-block"><p className="text-gray-700">请添加微信</p></div>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button onClick={() => setTab('users')} className={`px-6 py-3 rounded-lg ${tab === 'users' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}>用户管理 ({users.length})</button>
          <button onClick={() => setTab('codes')} className={`px-6 py-3 rounded-lg ${tab === 'codes' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}>兑换码管理</button>
        </div>

        {tab === 'users' && (
          <div className="space-y-6">
            <div className="p-6 bg-white border border-gray-200 rounded-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">手动充值</h2>
              <div className="flex gap-4">
                <input type="email" placeholder="用户邮箱" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} className="flex-1 p-3 bg-white border border-gray-300 rounded-xl text-gray-900" />
                <input type="number" placeholder="积分" value={rechargeAmount} onChange={(e) => setRechargeAmount(Number(e.target.value))} className="w-32 p-3 bg-white border border-gray-300 rounded-xl text-gray-900" />
                <button onClick={rechargeUser} disabled={loading} className="px-6 py-3 bg-blue-500 text-white rounded-xl disabled:opacity-50">充值</button>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="p-4 text-left text-gray-700">邮箱</th><th className="p-4 text-left text-gray-700">积分</th><th className="p-4 text-left text-gray-700">操作</th></tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="p-4 text-gray-900">{user.email}</td>
                      <td className="p-4 text-blue-600">{user.credits}</td>
                      <td className="p-4"><button onClick={() => deleteUser(user.email)} className="text-red-500">删除</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'codes' && (
          <div className="p-6 bg-white border border-gray-200 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">兑换码功能开发中...</h2>
          </div>
        )}
      </div>
    </div>
  )
}
