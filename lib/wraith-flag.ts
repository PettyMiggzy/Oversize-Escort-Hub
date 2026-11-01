// Wraith is OFF unless WRAITH_LIVE=on is set on the server (a Vercel setting). Kept in its own file so the layout can read it cheaply.
export const wraithLive = () => process.env.WRAITH_LIVE === 'on'
