import { ref, unref, Ref, computed } from 'vue'
import { Buffer } from 'buffer'
import useSwal from './useSwal'

const { toast } = useSwal()

const getAccessToken = async (host: string, apitoken: string) => {
  if (typeof host !== 'string' || typeof apitoken !== 'string' || host === '' || apitoken === '') throw Error('invalid credentials')
  const base64ApiToken = Buffer.from(`apitoken:${apitoken}`).toString('base64')
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Basic ${base64ApiToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: Object.entries({ grant_type: 'client_credentials' }).map(([key, value]) => `${key}=${value}`).join('&')
  }
  const response = await fetch(`https://${host}/services/mtm/v1/oauth2/token`, options)
  const { status } = response
  const body = await response.json()
  if (status === 200) {
    const { access_token: accessToken } = body
    return accessToken
  } else {
    throw Error(`${JSON.stringify(body)}`)
  }
}

const isAuthenticating = ref(false)
const accessToken: Ref<null | string> = ref(null)

const authenticate = async (host: string, apitoken: string) => {
  if (unref(isAuthenticating)) return
  try {
    isAuthenticating.value = true
    accessToken.value = await getAccessToken(host, apitoken)
  } catch (err) {
    console.error(err)
    void toast.fire({
      title: 'Error while loggin in',
      text: 'Check console for more details',
      icon: 'error'
    })
    accessToken.value = null
  } finally {
    isAuthenticating.value = false
  }
}

const logout = async () => { accessToken.value = null }

const useWorkspace = () => {
  return {
    authenticate,
    isAuthenticating,
    isAuthenticated: computed(() => unref(accessToken) !== null),
    logout
  }
}

export default useWorkspace
