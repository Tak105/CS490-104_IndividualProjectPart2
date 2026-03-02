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
  
  // Customer Information
  const [customers, setCustomers] = useState([]);
  const [customerPage, setCustomerPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [searchId, setSearchId] = useState("");
  const [searchFirst, setSearchFirst] = useState("");
  const [searchLast, setSearchLast] = useState("");
  
  const [newCustomer, setNewCustomer] = useState({
    store_id: "",
    first_name: "",
    last_name: "",
    email: "",
    address_id: ""
  });
  
  const [customerMessage, setCustomerMessage] = useState("");
  
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
    const customer_id = prompt("Enter Customer Id:");
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
  
  // Fetch Customer Details
  async function fetchCustomers(pageNum = 1) {
    const res = await fetch(`/api/customers?page=${pageNum}&limit=10`);
    const data = await res.json();
    
    setCustomers(data.data);
    setCustomerPage(data.page);
    setTotalPages(data.total_pages);
  }
  
  async function handleCustomerSearch() {
    const params = new URLSearchParams();
    
    if (searchId) params.append("customer_id", searchId);
    if (searchFirst) params.append("first_name", searchFirst);
    if (searchLast) params.append("last_name", searchLast);
    
    const res = await fetch(`/api/customers/search?${params.toString()}`);
    const data = await res.json();
    setCustomers(data);
  }
  
  async function handleAddCustomer() {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer)
    });
    
    const data = await res.json();
    
    if (res.ok) {
      setCustomerMessage("Customer Added Successfully!");
      fetchCustomers(customerPage);
      setNewCustomer({
        store_id: "",
        first_name: "",
        last_name: "",
        email: "",
        address_id: ""
      });
    } else {
      setCustomerMessage(data.error);
    }
  }
  
  async function handleDeleteCustomer(id) {
    if (!window.confirm("Do you want to delete this Customer Id?")) return;
    
    const res = await fetch(`/api/customers/${id}`, {
      method: "DELETE"
    });
    
    const data = await res.json();
    
    if (res.ok) {
      fetchCustomers(customerPage);
    } else {
      alert(data.error);
    }
  }
  
  async function handleCustomerDetails(id) {
    if (selectedCustomer && selectedCustomer.customer.customer_id === id) {
      setSelectedCustomer(null);
      return;
    }
    
    const res = await fetch(`/api/customers/${id}`);
    if (!res.ok) return;
    
    const data = await res.json();
    setSelectedCustomer(data);
  }
  
  async function handleEditCustomer() {
    const res = await fetch(`/api/customers/${editingCustomer.customer_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingCustomer)
    });
    
    const data = await res.json();
    
    if (res.ok) {
      fetchCustomers(customerPage);
      setEditingCustomer(null);
    } else {
      alert(data.error);
    }
  }
  
  async function handleReturn(rental_id) {
    const res = await fetch(`/api/rentals/${rental_id}`, {
      method: "PUT"
    });
    
    const data = await res.json();
    
    if (res.ok) {
      handleCustomerDetails(selectedCustomer.customer.customer_id);
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
        <button onClick={() => {setPage("customers");fetchCustomers(1);}}>Customer Page</button>
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
      
      {page === "customers" && (
        <>
          <h1>Search Customers</h1>
          <input placeholder="Customer Id" onChange={e => setSearchId(e.target.value)} />
          <input placeholder="First Name" onChange={e => setSearchFirst(e.target.value)} />
          <input placeholder="Last Name" onChange={e => setSearchLast(e.target.value)} />
          <button onClick={handleCustomerSearch}>Search</button>
          <button onClick={() => fetchCustomers(1)}>Reset</button>
          
          <hr />
          
          {customers.map(c => (
            <div key={c.customer_id} style={{border:"1px solid #ccc", margin:"10px", padding:"10px"}}>
              <strong>{c.first_name} {c.last_name}</strong>
              <p>{c.email}</p>
              
              <button onClick={() => handleCustomerDetails(c.customer_id)}>More/Hide Details</button>
              <button onClick={() => setEditingCustomer(c)}>Edit</button>
              <button onClick={() => handleDeleteCustomer(c.customer_id)}>Delete</button>
            </div>
          ))}
          
          <div>
            <button
              disabled={customerPage === 1}
              onClick={() => fetchCustomers(customerPage - 1)}
            >
              Prev
            </button>
            
            <span> Page {customerPage} of {totalPages} </span>
            
            <button
              disabled={customerPage === totalPages}
              onClick={() => fetchCustomers(customerPage + 1)}
            >
              Next
            </button>
          </div>
          
          <hr />
          
          {editingCustomer && (
            <>
              <h3>Customer to Edit</h3>
              <input value={editingCustomer.first_name}
                onChange={e => setEditingCustomer({...editingCustomer, first_name: e.target.value})}
              />
              <input value={editingCustomer.last_name}
                onChange={e => setEditingCustomer({...editingCustomer, last_name: e.target.value})}
              />
              <input value={editingCustomer.email}
                onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})}
              />
              <input value={editingCustomer.address_id}
                onChange={e => setEditingCustomer({...editingCustomer, address_id: e.target.value})}
              />
              <button onClick={handleEditCustomer}>Save</button>
            </>
          )}
          
          {selectedCustomer && (
            <>
              <hr />
              <h3>
                {selectedCustomer.customer.first_name}{" "}{selectedCustomer.customer.last_name}'s Rental Histories
              </h3>
              
              {selectedCustomer.rentals.map(r => (
                <div key={r.rental_id}>
                  {r.title} |
                  Rented: {r.rental_date} |
                  Returned: {r.return_date || "Not Returned "}
                  
                  {!r.return_date && (
                    <button onClick={() => handleReturn(r.rental_id)}>
                      Mark Returned
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
          
          <hr />
          
          <h3>Customer to Add</h3>
          <input placeholder="Store Id"
            value={newCustomer.store_id}
            onChange={e => setNewCustomer({...newCustomer, store_id: e.target.value})}
          />
          <input placeholder="First Name"
            value={newCustomer.first_name}
            onChange={e => setNewCustomer({...newCustomer, first_name: e.target.value})}
          />
          <input placeholder="Last Name"
            value={newCustomer.last_name}
            onChange={e => setNewCustomer({...newCustomer, last_name: e.target.value})}
          />
          <input placeholder="Email"
            value={newCustomer.email}
            onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
          />
          <input placeholder="Address Id"
            value={newCustomer.address_id}
            onChange={e => setNewCustomer({...newCustomer, address_id: e.target.value})}
          />
          <button onClick={handleAddCustomer}>Submit</button>
          
          {customerMessage && <p>{customerMessage}</p>}
        </>
      )}
    </div>
  );
}

export default App;