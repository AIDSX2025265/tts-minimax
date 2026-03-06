import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// 内存存储（生产环境请用数据库）
const users: {id: string, email: string, password: string, name: string}[] = [
  { id: '1', email: 'test@example.com', password: 'password123', name: '测试用户' }
]

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text", required: false }
      },
      async authorize(credentials, req) {
        // 注册逻辑
        if (req.body && (req.body as any).action === 'register') {
          const { email, password, name } = credentials || {}
          if (!email || !password) return null
          
          const exists = users.find(u => u.email === email)
          if (exists) return null
          
          const newUser = {
            id: String(users.length + 1),
            email,
            password,
            name: name || email.split('@')[0]
          }
          users.push(newUser)
          return { id: newUser.id, email: newUser.email, name: newUser.name }
        }
        
        // 登录逻辑
        const user = users.find(u => u.email === credentials?.email && u.password === credentials?.password)
        if (user) return { id: user.id, email: user.email, name: user.name }
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-prod',
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id
      return session
    }
  }
})

export { handler as GET, handler as POST }
