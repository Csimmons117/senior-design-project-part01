import React, { useState } from 'react'

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [resp, setResp] = useState('')

  async function send() {
    setResp('Thinking...')
    const r = await fetch(process.env.VITE_TRAINER_API || 'http://localhost:3001/api/trainer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] })
    })
    const data = await r.json()
    setResp(data?.choices?.[0]?.message?.content || JSON.stringify(data))
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Personal Trainer (PWA)</h1>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} style={{ width: '100%' }}/>
      <button onClick={send} style={{ marginTop: 8 }}>Ask</button>
      <pre style={{ marginTop: 12 }}>{resp}</pre>
    </div>
  )
}