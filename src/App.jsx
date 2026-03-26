import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import ProtectedRoute from './ProtectedRoute';
import './App.css';

function App() {
<<<<<<< HEAD
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
=======
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: '',
    date: '',
    notes: '',
  })
  const [message, setMessage] = useState('')

  // search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')


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

  //search function
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchMessage('Please enter a search query.')
      setSearchResults([])
      return
    }
    setIsSearching(true) 
    setSearchMessage('') 
    try {
      const response = await fetch('http://localhost:5000/api/notes')
      const data = await response.json()

      const filteredResults = data.filter(note =>
        note.patientName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(filteredResults)
    } catch (err) {
      setSearchMessage('Could not connect to server.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'Arial' }}>
      <h1>EHR - Upload Medical Notes</h1>

      <div style = {{ marginBottom: '24px' }}>
        <h2>Search Patients</h2>
        <form onSubmit={handleSearch}>
          <div style= {{ display: 'flex', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Search for patients (e.g., 'John Doe')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '8px' }}
            />
            <button 
              type="submit" 
              style={{ 
                padding: '8px 16px', 
                marginLeft: '8px' 
              }}
            >
              Search
            </button>
          </div>
        </form>
        {searchMessage && <p style={{ color: 'red' }}>
          {searchMessage}
          </p>
        }
        {searchResults.length > 0 && (
          <div>
            <h2>Search Results</h2>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '8px' }}>
              {searchResults.map((note, index) => (
                <div key={index} style={{ marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                  <p><strong>Patient:</strong> {note.patientName}</p>
                  <p><strong>Doctor:</strong> {note.doctorName}</p>
                  <p><strong>Date:</strong> {note.date}</p>
                  <p><strong>Notes:</strong> {note.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
>>>>>>> afe8547887684d0ea24e91b62c959843c87312f2
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
