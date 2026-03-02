import os
from dotenv import load_dotenv
from sqlalchemy import text
from flask import Flask, jsonify, request
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
                                          group by f.film_id, f.title
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
            return jsonify({"error": "Film Not Found"}), 404
        
        return jsonify(dict(film)), 200
    
    @app.get("/api/actors/top5")
    def top5_actors(): # Landing Page - User wants to view the top 5 actors that are part of films in the store
        actors = mydb.session.execute(text("""
                                           select a.actor_id, a.first_name, a.last_name, COUNT(r.rental_id) as rental_count
                                           from actor a join film_actor fa on a.actor_id = fa.actor_id
                                           join inventory i on fa.film_id = i.film_id
                                           join rental r on i.inventory_id = r.inventory_id
                                           group by a.actor_id, a.first_name, a.last_name
                                           order by rental_count desc
                                           limit 5
                                           """)).mappings().all()
        
        return jsonify([dict(a) for a in actors]), 200
    
    # Landing Page - User wants to click on any of the top 5 actors in order to view its details and their top 5 rented films
    @app.get("/api/actors/<int:actor_id>")
    def actor_details(actor_id):
        actor = mydb.session.execute(text("""
                                          select actor_id, first_name, last_name
                                          from actor
                                          where actor_id = :actor_id
                                          """), {"actor_id": actor_id}).mappings().first()
        
        if not actor:
            return jsonify({"error": "Actor Not Found"}), 404
        
        films = mydb.session.execute(text("""
                                          select f.film_id, f.title, COUNT(r.rental_id) as rental_count
                                          from film_actor fa join film f on fa.film_id = f.film_id
                                          join inventory i on f.film_id = i.film_id
                                          join rental r on i.inventory_id = r.inventory_id
                                          where fa.actor_id = :actor_id
                                          group by f.film_id, f.title
                                          order by rental_count desc
                                          limit 5
                                          """), {"actor_id": actor_id}).mappings().all()
        
        return jsonify({"actor": dict(actor), "top_films": [dict(f) for f in films]}), 200
    
    # Films Page - User wants to search a film by their Name, Actor, or Genre
    # Films Page - User wants to click on the film to view its details
    @app.get("/api/films/search")
    def search_films():
        query = request.args.get("q", "")
        like = f"%{query}%"
        
        films = mydb.session.execute(text("""
                                          select distinct f.film_id, f.title, f.description
                                          from film f left join film_actor fa on f.film_id = fa.film_id
                                          left join actor a on fa.actor_id = a.actor_id
                                          left join film_category fc on f.film_id = fc.film_id
                                          left join category c on fc.category_id = c.category_id
                                          where f.title like :like
                                          or concat(a.first_name, ' ', a.last_name) like :like
                                          or c.name like :like
                                          """), {"like": like}).mappings().all()
        
        return jsonify([dict(f) for f in films]), 200
    
    # Films Page - User wants to rent out a film to customers
    @app.post("/api/rent")
    def rent_film():
        data = request.json
        film_id = data.get("film_id")
        customer_id = data.get("customer_id")
        
        if not film_id or not customer_id:
            return jsonify({"error": "Missing Data"}), 400
        
        customer = mydb.session.execute(text("""
                                             select customer_id
                                             from customer
                                             where customer_id = :customer_id
                                             """), {"customer_id": customer_id}).mappings().first()
        
        if not customer:
            return jsonify({"error": "Customer Not Found"}), 404
        
        inventory = mydb.session.execute(text("""
                                              select i.inventory_id
                                              from inventory i
                                              left join rental r on i.inventory_id = r.inventory_id and r.return_date is null
                                              where i.film_id = :film_id and r.rental_id is null
                                              limit 1
                                              """), {"film_id": film_id}).mappings().first()
        
        if not inventory:
            return jsonify({"error": "No Inventory Available"}), 400
        
        mydb.session.execute(text("""
                                  insert into rental (rental_date, inventory_id, customer_id, staff_id)
                                  values (now(), :inventory_id, :customer_id, 1)
                                  """), {"inventory_id": inventory["inventory_id"], "customer_id": customer_id})
        
        mydb.session.commit()
        return jsonify({"message": "Film Rented Successfully"}), 201
    
    @app.get("/api/customers")
    def list_customers(): # Customer Page - User wants to view a list of all customers (Pagination)
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        offset = (page - 1) * limit
        
        total = mydb.session.execute(text("""select count(*) as total from customer""")).mappings().first()["total"]
        customers = mydb.session.execute(text("""
                                              select customer_id, first_name, last_name, email, address_id, active
                                              from customer
                                              order by customer_id asc
                                              limit :limit offset :offset
                                              """), {"limit": limit, "offset": offset}).mappings().all()
        
        return jsonify({
            "data": [dict(c) for c in customers],
            "total": total,
            "page": page,
            "total_pages": (total + limit - 1) // limit
        }), 200
    
    @app.get("/api/customers/search")
    def search_customers(): # Customer Page - User wants to filter/search customers
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        offset = (page - 1) * limit
        
        customer_id = request.args.get("customer_id")
        first_name = request.args.get("first_name")
        last_name = request.args.get("last_name")
        
        query = """select customer_id, first_name, last_name, email, address_id, active from customer where 1=1"""
        params = {}
        
        if customer_id:
            query += " and customer_id = :customer_id"
            params["customer_id"] = customer_id
        
        if first_name:
            query += " and lower(first_name) like lower(:first_name)"
            params["first_name"] = f"%{first_name}%"
        
        if last_name:
            query += " and lower(last_name) like lower(:last_name)"
            params["last_name"] = f"%{last_name}%"
        
        query += " order by customer_id asc limit :limit offset :offset"
        params["limit"] = limit
        params["offset"] = offset
        customers = mydb.session.execute(text(query), params).mappings().all()
        
        return jsonify([dict(c) for c in customers]), 200
    
    @app.post("/api/customers")
    def add_customer(): # Customer Page - User wants to add new customers
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400
        
        required_fields = ["store_id", "first_name", "last_name", "email", "address_id"]
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": "Must fill in the Required Fields"}), 400
        
        try:
            mydb.session.execute(text("""
                                      insert into customer
                                      (store_id, first_name, last_name, email, address_id, active, create_date)
                                      values
                                      (:store_id, :first_name, :last_name, :email, :address_id, 1, now())
                                      """), {
                                      "store_id": data["store_id"],
                                      "first_name": data["first_name"],
                                      "last_name": data["last_name"],
                                      "email": data["email"],
                                      "address_id": data["address_id"]})
            
            mydb.session.commit()
            return jsonify({"message": "Customer Added Successfully"}), 201
        
        except Exception:
            mydb.session.rollback()
            return jsonify({"error": "Customer Creation Failed"}), 500
    
    @app.put("/api/customers/<int:customer_id>")
    def edit_customer(customer_id): # Customer Page - User wants to edit the customer's details
        data = request.get_json()
        
        customer = mydb.session.execute(text("""
                                             select customer_id
                                             from customer
                                             where customer_id = :customer_id
                                             """), {"customer_id": customer_id}).mappings().first()
        
        if not customer:
            return jsonify({"error": "Customer Not Found"}), 404
        
        try:
            mydb.session.execute(text("""
                                      update customer
                                      set first_name = :first_name,
                                          last_name = :last_name,
                                          email = :email,
                                          address_id = :address_id,
                                          active = :active
                                      where customer_id = :customer_id
                                      """), {
                                      "customer_id": customer_id,
                                      "first_name": data["first_name"],
                                      "last_name": data["last_name"],
                                      "email": data["email"],
                                      "address_id": data["address_id"],
                                      "active": data.get("active", 1)})
            
            mydb.session.commit()
            return jsonify({"message": "Customer Edited Successfully"}), 200
        
        except Exception:
            mydb.session.rollback()
            return jsonify({"error": "Edit Failed"}), 500
    
    @app.delete("/api/customers/<int:customer_id>")
    def delete_customer(customer_id): # Customer Page - User wants to delete customers
        customer = mydb.session.execute(text("""
                                             select customer_id
                                             from customer
                                             where customer_id = :customer_id
                                             """), {"customer_id": customer_id}).mappings().first()
        
        if not customer:
            return jsonify({"error": "Customer Not Found"}), 404
        
        try:
            mydb.session.execute(text("""delete from customer where customer_id = :customer_id"""), {"customer_id": customer_id})
            mydb.session.commit()
            return jsonify({"message": "Customer Deleted Successfully"}), 200
        
        except Exception:
            mydb.session.rollback()
            return jsonify({"error": "Delete Failed (Customer may have Rentals)"}), 400
    
    @app.get("/api/customers/<int:customer_id>")
    def customer_details(customer_id): # Customer Page - User wants to view the customer's details along with their rental histories
        customer = mydb.session.execute(text("""
                                             select customer_id, first_name, last_name, email, active
                                             from customer
                                             where customer_id = :customer_id
                                             """), {"customer_id": customer_id}).mappings().first()
        
        if not customer:
            return jsonify({"error": "Customer Not Found"}), 404
        
        rentals = mydb.session.execute(text("""
                                            select r.rental_id, f.title, r.rental_date, r.return_date
                                            from rental r join inventory i on r.inventory_id = i.inventory_id
                                            join film f on i.film_id = f.film_id
                                            where r.customer_id = :customer_id
                                            order by r.rental_date desc
                                            """), {"customer_id": customer_id}).mappings().all()
        
        return jsonify({"customer": dict(customer), "rentals": [dict(r) for r in rentals]}), 200
    
    @app.put("/api/rentals/<int:rental_id>")
    def return_movie(rental_id): # Customer Page - User wants to indicate that a customer has returned a rented movie
        rental = mydb.session.execute(text("""
                                           select rental_id
                                           from rental
                                           where rental_id = :rental_id and return_date is null
                                           """), {"rental_id": rental_id}).mappings().first()
        
        if not rental:
            return jsonify({"error": "Rental Not Found"}), 404
        
        mydb.session.execute(text("""
                                  update rental
                                  set return_date = now()
                                  where rental_id = :rental_id
                                  """), {"rental_id": rental_id})
        
        mydb.session.commit()
        return jsonify({"message": "Movie Returned Successfully"}), 200
    
    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)