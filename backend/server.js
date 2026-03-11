import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// store notes in memory for now
const medicalNotes = []

// POST route to receive form data from the frontend
app.post('/api/notes', (req, res) => {
  const { patientName, doctorName, date, notes } = req.body;

  // basic validation
  if (!patientName || !doctorName || !date || !notes) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // save the note
  const newNote = { patientName, doctorName, date, notes };
  medicalNotes.push(newNote);

  console.log("New medical note saved:", newNote);
  res.status(201).json({message: "Note saved successfully.", note: newNote });
});

// GET route to view all saved notes
app.get('/api/notes', (req, res) => {
  res.json(medicalNotes);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
