import os
from dotenv import load_dotenv
from sqlalchemy import text
from flask import Flask, jsonify
from db import mydb

def create_app():
    load_dotenv()
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DB_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    mydb.init_app(app)
    
    @app.get("/api/films/top5")
    def top5_films(): # Landing Page - User wants to view the top 5 rented films of all time
        films = mydb.session.execute(text("""
                                          select f.film_id, f.title, COUNT(r.rental_id) as rental_count
                                          from film f join inventory i on f.film_id = i.film_id 
                                          join rental r on i.inventory_id = r.inventory_id
                                          group by f.film_id
                                          order by rental_count desc
                                          limit 5
                                          """)).mappings().all()
        
        return jsonify([dict(f) for f in films]), 200
    
    @app.get("/api/films/<int:film_id>")
    def film_details(film_id): # Landing Page - User wants to click on any of the top 5 rented films in order to view its details
        film = mydb.session.execute(text("""
                                         select film_id, title, description, release_year, rating, length, rental_rate
                                         from film
                                         where film_id = :film_id
                                         """), {"film_id": film_id}).mappings().first()
        
        if not film:
            return jsonify({"error": "film not found"}), 404
        
        return jsonify(dict(film)), 200
    
    @app.get("/api/actors/top5")
    def top5_actors(): # Landing Page - User wants to view the top 5 actors that are part of films in the store
        actors = mydb.session.execute(text("""
                                           select a.actor_id, a.first_name, a.last_name, COUNT(r.rental_id) as rental_count
                                           from actor a join film_actor fa on a.actor_id = fa.actor_id 
                                           join inventory i on fa.film_id = i.film_id 
                                           join rental r on i.inventory_id = r.inventory_id
                                           group by a.actor_id
                                           order by rental_count desc
                                           limit 5
                                           """)).mappings().all()
        
        return jsonify([dict(a) for a in actors]), 200

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)