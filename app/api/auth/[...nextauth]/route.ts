import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 兼容 email 或 username 字段
        const inputEmail = credentials?.email || credentials?.username;
        if (!inputEmail) {
          return null
        }

        console.log("Authorize called with input:", inputEmail);
        console.log("ENV FEISHU_APP_TOKEN:", process.env.FEISHU_APP_TOKEN);
        console.log("ENV FEISHU_TABLE_ID:", process.env.FEISHU_TABLE_ID);

        const APP_ID = process.env.FEISHU_APP_ID;
        const APP_SECRET = process.env.FEISHU_APP_SECRET;
        const APP_TOKEN = process.env.FEISHU_APP_TOKEN; // Assuming you have this set as env var or hardcode it temporarily
        const TABLE_ID = process.env.FEISHU_TABLE_ID; // Assuming you have this set as env var or hardcode it temporarily
        const FIELD_EMAIL = '文本 3'; // Assuming your email field name is '文本 3'
        const FIELD_PASSWORD = '文本 2'; // Assuming your password field name is '文本 2'
        const FIELD_NAME = '文本'; // Assuming your name field is '文本'
        const FIELD_CREDITS = '积分'; // Assuming your credits field is '积分'

        let cachedToken: string | null = null
        let tokenExpire = 0

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
          return data.data?.records || []
        }

        // Allow test account for development - check BEFORE calling Feishu API
        if (credentials.email === 'test@example.com' && credentials.password === 'password123') {
          return {
            id: 'test-admin',
            email: 'test@example.com',
            name: 'Test Admin',
            credits: -1 // -1 means unlimited credits for test account
          }
        }

        try {
          const records = await queryUsers()
          // 极度宽松的邮箱匹配：去除空格，忽略大小写
          const inputEmail = credentials.email.trim().toLowerCase();
          const user = records.find((r: any) => {
            const tableEmail = r.fields[FIELD_EMAIL] ? String(r.fields[FIELD_EMAIL]).trim().toLowerCase() : '';
            return tableEmail === inputEmail;
          })

          if (user) {
            return {
              id: user.record_id,
              email: user.fields[FIELD_EMAIL],
              name: user.fields[FIELD_NAME],
              credits: user.fields[FIELD_CREDITS] || 0
            }
          }
        } catch (error) {
          console.error("Feishu authentication error:", error);
        }

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
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.credits = (user as any).credits; // 将 credits 添加到 token 中
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).email = token.email;
        (session.user as any).name = token.name;
        (session.user as any).credits = (token as any).credits; // 将 credits 添加到 session 中
      }
      return session;
    }
  }
})

export { handler as GET, handler as POST }
