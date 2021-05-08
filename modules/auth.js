import cookie from 'cookie'
import { OAuth2Client } from 'google-auth-library'

export default function () {
  const authConfig = this.options.publicRuntimeConfig.auth

  // add this middleware first before nuxt's middlewares
  this.nuxt.hook('render:setupMiddleware', (app) => {
    app.use('/api', handler)
  })

  // enable spa mode for admin route
  this.nuxt.hook('render:setupMiddleware', (app) => {
    app.use('/admin', (req, res, next) => {
      res.spa = true
      next()
    })
  })

  async function handler (req, res, next) {
    const idToken = cookie.parse(req.headers.cookie)[authConfig.cookieName]
    if (!idToken) return rejectHit(res)
    const ticket = await getUser(idToken)
    if (!ticket) return rejectHit(res)

    req.identity = {
      id: ticket.sub,
      email: ticket.email,
      name: ticket.name,
      image: ticket.picture
    }
    next()
  }

  async function getUser (idToken) {
    const client = new OAuth2Client(authConfig.clientId)
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: authConfig.clientId
      })
      return ticket.getPayload()
    } catch (err) {
      console.error(err)
    }
  }

  function rejectHit (res) {
    res.statusCode = 401
    res.end()
  }
}
