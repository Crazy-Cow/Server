const REFRESH_KEY = process.env.CHALLENGERMODE_BOT_REFRESH_KEY
const ACCESS_KEY_ENDPOINT =
    'https://publicapi.challengermode.com/mk1/v1/auth/access_keys'

let cachedToken: string | null = null
let expiresAt: number | null = null

export async function getBotAccessToken(): Promise<string> {
    const now = Date.now()
    // 만료 1분 전이면 갱신
    if (cachedToken && expiresAt && now < expiresAt - 60 * 1000) {
        return cachedToken
    }
    if (!REFRESH_KEY)
        throw new Error('CHALLENGERMODE_BOT_REFRESH_KEY 환경변수 필요')

    const res = await fetch(ACCESS_KEY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshKey: REFRESH_KEY }),
    })
    if (!res.ok) throw new Error('Bot Access Key 발급 실패')
    const { value, expiresAt: expiresAtStr } = await res.json()
    cachedToken = value
    expiresAt = new Date(expiresAtStr).getTime()
    return cachedToken
}
