import { useEffect, useState } from 'react'
import { getStoredToken } from '@/lib/token-storage'
import { requestJobPostingExtraction } from '@/lib/request-job-posting-extraction'
import { createExternalApplication } from '@/lib/create-external-application'
import './App.css'

type Status =
  | 'checking'
  | 'no-token'
  | 'extracting'
  | 'unsupported-page'
  | 'form'
  | 'submitting'
  | 'success'
  | 'already-captured'
  | 'submit-error'

function SettingsButton() {
  return (
    <button
      type="button"
      className="settings-link"
      onClick={() => chrome.runtime.openOptionsPage()}
    >
      Settings
    </button>
  )
}

export default function App() {
  const [status, setStatus] = useState<Status>('checking')
  const [token, setToken] = useState('')
  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [applicationId, setApplicationId] = useState('')

  useEffect(() => {
    void (async () => {
      const storedToken = await getStoredToken()
      if (!storedToken) {
        setStatus('no-token')
        return
      }
      setToken(storedToken)
      setStatus('extracting')

      const extracted = await requestJobPostingExtraction()
      if (!extracted) {
        setStatus('unsupported-page')
        return
      }

      setTitle(extracted.title ?? '')
      setCompanyName(extracted.companyName ?? '')
      setDescription(extracted.description ?? '')
      setSkills(extracted.skills ?? '')
      setExternalUrl(extracted.externalUrl)
      setStatus('form')
    })()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')

    try {
      const result = await createExternalApplication(token, {
        title,
        description,
        externalUrl,
        companyName,
        skills: skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      })
      setApplicationId(result.application.id as string)
      setStatus(result.alreadyCaptured ? 'already-captured' : 'success')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to create application',
      )
      setStatus('submit-error')
    }
  }

  if (status === 'checking' || status === 'extracting') {
    return <div className="popup">Loading…</div>
  }

  if (status === 'no-token') {
    return (
      <div className="popup">
        <p>No token configured.</p>
        <button type="button" onClick={() => chrome.runtime.openOptionsPage()}>
          Open Settings
        </button>
      </div>
    )
  }

  if (status === 'unsupported-page') {
    return (
      <div className="popup">
        <SettingsButton />
        <p>Open a LinkedIn job posting to capture it here.</p>
      </div>
    )
  }

  if (status === 'success' || status === 'already-captured') {
    return (
      <div className="popup">
        <SettingsButton />
        <p>
          {status === 'already-captured' ? 'Already captured.' : 'Application created.'}
        </p>
        <a
          href={`${import.meta.env.VITE_FRONTEND_URL}/applications/${applicationId}`}
          target="_blank"
          rel="noreferrer"
        >
          View application
        </a>
      </div>
    )
  }

  return (
    <div className="popup">
      <SettingsButton />
      <form onSubmit={handleSubmit}>
        {status === 'submit-error' && <p role="alert">{errorMessage}</p>}

        <label htmlFor="title">Title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />

        <label htmlFor="companyName">Company</label>
        <input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label htmlFor="skills">Skills</label>
        <input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} />

        <button type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Capturing…' : 'Capture'}
        </button>
      </form>
    </div>
  )
}
