import { useState, useEffect } from "react";
import "./App.css";

function App() {
  // Get the materials and access it (backend)
  const [page, setPage] = useState("landing");
  const [films, setFilms] = useState([]);
  const [actors, setActors] = useState([]);

  // Film Expansion State
  const [expandedFilmId, setExpandedFilmId] = useState(null);
  const [selectedFilm, setSelectedFilm] = useState(null);

  // Actor Expansion State
  const [expandedActorId, setExpandedActorId] = useState(null);
  const [selectedActor, setSelectedActor] = useState(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Fetch the Top 5 Rented Films and the Top 5 Actors
  useEffect(() => {
    fetch("/api/films/top5")
      .then(res => res.json())
      .then(setFilms);

    fetch("/api/actors/top5")
      .then(res => res.json())
      .then(setActors);
  }, []);

  // Fetch the Film Details
  async function handleFilmDetails(film_id) {
    if (expandedFilmId === film_id) {
      setExpandedFilmId(null);
      setSelectedFilm(null);
      return;
    }

    setExpandedFilmId(film_id);
    setSelectedFilm(null);

    const res = await fetch(`/api/films/${film_id}`);
    if (!res.ok) return;

    const data = await res.json();
    setSelectedFilm(data);
  }

  // Fetch the Actor Details
  async function handleActorDetails(actor_id) {
    if (expandedActorId === actor_id) {
      setExpandedActorId(null);
      setSelectedActor(null);
      return;
    }

    setExpandedActorId(actor_id);
    setSelectedActor(null);

    const res = await fetch(`/api/actors/${actor_id}`);
    if (!res.ok) return;

    const data = await res.json();
    setSelectedActor(data);
  }

  // Fetch the Search Details
  async function handleSearch() {
    const res = await fetch(`/api/films/search?q=${searchTerm}`);
    const data = await res.json();
    setSearchResults(data);
    setExpandedFilmId(null);
    setSelectedFilm(null);
  }

  // Fetch the Rent Details
  async function handleRent(film_id) {
    const customer_id = prompt("Enter Customer ID:");
    if (!customer_id) return;

    const res = await fetch("/api/rent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ film_id, customer_id })
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message);
    } else {
      alert(data.error);
    }
  }

  // User Interface
  return (
    <div className="container">

      {/* Navigation */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setPage("landing")}>Landing Page</button>
        <button onClick={() => setPage("films")}>Films Page</button>
      </div>

      {page === "landing" && (
        <>
          <h1>Top 5 Rented Films</h1>

          {films.map(film => (
            <div key={film.film_id} className="film-card">

              <p><strong>{film.title}</strong></p>
              <p>Rented: {film.rental_count}</p>

              <button onClick={() => handleFilmDetails(film.film_id)}>
                {expandedFilmId === film.film_id ? "Hide Details" : "More Details"}
              </button>

              {expandedFilmId === film.film_id && selectedFilm && (
                <div className="film-details">
                  <p>{selectedFilm.description}</p>
                  <p>Release Year: {selectedFilm.release_year}</p>
                  <p>Rating: {selectedFilm.rating}</p>
                  <p>Length: {selectedFilm.length} mins</p>
                  <p>Rental Rate: ${selectedFilm.rental_rate}</p>
                </div>
              )}

            </div>
          ))}

          <hr />

          <h1>Top 5 Actors</h1>

          {actors.map(actor => (
            <div key={actor.actor_id} className="actor-card">

              <p><strong>{actor.first_name} {actor.last_name}</strong></p>
              <p>appeared in {actor.rental_count} rentals</p>

              <button onClick={() => handleActorDetails(actor.actor_id)}>
                {expandedActorId === actor.actor_id ? "Hide Details" : "More Details"}
              </button>

              {expandedActorId === actor.actor_id && selectedActor && (
                <div className="actor-details">

                  <h4>Top 5 Rented Films</h4>

                  {selectedActor.top_films.map(film => (
                    <p key={film.film_id}>
                      {film.title} ({film.rental_count} rentals)
                    </p>
                  ))}

                </div>
              )}

            </div>
          ))}

        </>
      )}

      {page === "films" && (
        <>
          <h1>Search Films</h1>

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Title, Actor, or Genre"
          />
          <button onClick={handleSearch}>Search</button>

          {searchResults.map(film => (
            <div key={film.film_id} className="film-card">

              <h3>{film.title}</h3>

              <button onClick={() => handleFilmDetails(film.film_id)}>
                {expandedFilmId === film.film_id ? "Hide Details" : "More Details"}
              </button>

              <button onClick={() => handleRent(film.film_id)}>
                Rent Film
              </button>

              {expandedFilmId === film.film_id && selectedFilm && (
                <div className="film-details">
                  <p>{selectedFilm.description}</p>
                  <p>Release Year: {selectedFilm.release_year}</p>
                  <p>Rating: {selectedFilm.rating}</p>
                  <p>Length: {selectedFilm.length} mins</p>
                  <p>Rental Rate: ${selectedFilm.rental_rate}</p>
                </div>
              )}

            </div>
          ))}

        </>
      )}

    </div>
  );
}

export default App;