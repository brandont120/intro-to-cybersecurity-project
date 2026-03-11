import { useState } from 'react'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: '',
    date: '',
    notes: '',
  })
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage('Medical note saved successfully!')
        setFormData({ patientName: '', doctorName: '', date: '', notes: '' })
      } else {
        setMessage('Error: ' + data.error)
      }
    } catch (err) {
      setMessage('Could not connect to server.')
    }
  }

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'Arial' }}>
      <h1>EHR - Upload Medical Notes</h1>
      <form onSubmit={handleSubmit}>

        <div style={{ marginBottom: '12px' }}>
          <label>Patient Name</label><br />
          <input
            type="text"
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Doctor Name</label><br />
          <input
            type="text"
            name="doctorName"
            value={formData.doctorName}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Date</label><br />
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Medical Notes</label><br /> 
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />  
        </div> 

        <button type="submit" style={{ padding: '10px 20px' }}>
          Submit Notes
        </button>

      </form>
      {message && <p style={{ marginTop: '16px', color: 'green' }}>{message}</p>}
    </div>
  )
}

export default App
