import React, { useEffect, useState } from "react";
import { getPersonas } from "../services/api";

const PersonaSelector = ({ selectedPersona, onChange }) => {
  const [personas, setPersonas] = useState([]);

  useEffect(() => {
    async function fetchPersonas() {
      try {
        const list = await getPersonas(); // not data.personas
        setPersonas(list);
      } catch (err) {
        console.error("Error fetching personas:", err);
      }
    }
    fetchPersonas();
  }, []);

  return (
    <div className="persona-selector">
      <select
        className="persona-dropdown"
        value={selectedPersona}
        onChange={(e) => onChange(e.target.value)}
      >
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PersonaSelector;
