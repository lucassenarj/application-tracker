import { useEffect, useState } from 'react'
import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/token-storage'
import './App.css'

export default function App() {
  const [token, setToken] = useState('')
  const [hasStoredToken, setHasStoredToken] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    getStoredToken().then((stored) => {
      if (stored) {
        setToken(stored)
        setHasStoredToken(true)
      }
    })
  }, [])

  const handleSave = async () => {
    await setStoredToken(token)
    setHasStoredToken(true)
    setMessage('Token saved.')
  }

  const handleClear = async () => {
    await clearStoredToken()
    setToken('')
    setHasStoredToken(false)
    setMessage('Token cleared.')
  }

  return (
    <div className="options">
      <img src="/logo.png" alt="Application Tracker" className="logo" />
      <h1>Application Tracker for LinkedIn</h1>
      <p className="status">
        {hasStoredToken ? 'Token configured.' : 'No token configured.'}
      </p>
      <label htmlFor="token">Personal Access Token</label>
      <input
        id="token"
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste your token here"
      />
      <div className="actions">
        <button type="button" onClick={handleSave}>
          Save
        </button>
        <button type="button" onClick={handleClear}>
          Clear
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </div>
  )
}
