import { useState } from 'react'
import nhost from '@/lib/nhost'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const JwtButton = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      setLoading(true)
      let token = await nhost.auth.getAccessToken()
      if (!token) {
        await nhost.auth.refreshSession()
        token = await nhost.auth.getAccessToken()
      }
      if (!token) {
        toast({ title: 'No token', description: 'Sign in first, then try again.' })
        return
      }
      await navigator.clipboard.writeText(token)
      toast({ title: 'JWT copied', description: 'Access token has been copied to clipboard.' })
    } catch (e: any) {
      toast({ title: 'Failed to copy JWT', description: e?.message ?? 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button variant="secondary" onClick={handleCopy} disabled={loading}>
        {loading ? 'Getting JWT…' : 'Copy JWT'}
      </Button>
    </div>
  )
}

export default JwtButton
