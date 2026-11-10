import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import Cancionero from './components/Cancionero';
import SongDetailView from './components/SongDetailView';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [datos, setDatos] = useState(null);
  const [transpositions, setTranspositions] = useState({});

  useEffect(() => {
    import('./data/cancionero.json').then((m) => {
      setDatos(m.default || m);
    });
  }, []);

  const handleTranspose = (id, delta) => {
    setTranspositions((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + delta,
    }));
  };

  const handleResetTranspose = (id) => {
    setTranspositions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Cancionero
              datos={datos}
              theme={theme}
              toggleTheme={toggleTheme}
              transpositions={transpositions}
              onTranspose={handleTranspose}
              onResetTranspose={handleResetTranspose}
            />
          }
        />
        <Route
          path="/cancion/:slug"
          element={
            <SongDetailView
              datos={datos}
              theme={theme}
              toggleTheme={toggleTheme}
              transpositions={transpositions}
              onTranspose={handleTranspose}
              onResetTranspose={handleResetTranspose}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
