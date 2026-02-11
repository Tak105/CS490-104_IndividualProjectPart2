import { useState, useEffect } from 'react';
import './App.css';

function MovieModal({ open, onClose, film, loading }) {
  if(!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <p>Loading ...</p>
        ): film ? (
          <>
            <h2>{film.title}</h2>
            <p><strong>Release Year:</strong> {film.release_year}</p>
            <p><strong>Rating:</strong> {film.rating}</p>
            <p><strong>Length:</strong> {film.length} mins</p>
            <p><strong>Rental Rate:</strong> ${film.rental_rate}</p>
            <p>{film.description}</p>
            <button onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <p>Movie Not Found</p>
            <button onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  // Get the materials and access it (backend)
  const [films, setFilms] = useState([]);
  const [actors, setActors] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch the Top 5 Rented Films
  useEffect(() => {
    fetch("/api/films/top5")
      .then((res) => res.json())
      .then(setFilms);
  }, []);

  // Fetch the Top 5 Actors
  useEffect(() => {
    fetch("/api/actors/top5")
      .then((res) => res.json())
      .then(setActors);
  }, []);

  // Fetch the Film Details
  async function HandleMoreDetails(film_id) {
    setOpen(true);
    setSelectedFilm(null);
    setLoadingDetails(true);

    try {
      const res = await fetch(`/api/films/${film_id}`);
      if (!res.ok) {
        setSelectedFilm(null);
        return;
      }
      const data = await res.json();
      setSelectedFilm(data);
    }
    catch (err) {
      setSelectedFilm(null);
    }
    finally {
      setLoadingDetails(false);
    }
  }

  return (
    <div className="container">
      <h1>Top 5 Rented Films</h1>

      {films.map((film) => (
        <div key={film.film_id} className="film-card">
          <p><strong>{film.title}</strong></p>
          <p>Rented: {film.rental_count} times</p>
          <button onClick={() => HandleMoreDetails(film.film_id)}>More Details</button>
        </div>
      ))}

      <MovieModal
        open={open}
        onClose={() => setOpen(false)}
        film={selectedFilm}
        loading={loadingDetails}
      />

      <hr />

      <h1>The Top 5 Actors</h1>

      {actors.map(actor => (
        <div key={actor.actor_id} className="actor-card">
          <p><strong>{actor.first_name} {actor.last_name}</strong></p>
          <p>Appeared in {actor.rental_count} rentals</p>
        </div>
      ))}
    </div>
  );
}

export default App;