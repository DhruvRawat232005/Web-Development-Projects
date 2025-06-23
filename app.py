from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import stripe
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_your_default_test_key_here")

# Booking model
class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    email = db.Column(db.String(120))
    event_type = db.Column(db.String(100))
    date = db.Column(db.String(20))
    guests = db.Column(db.Integer)
    addons = db.Column(db.String(200))
    total_cost = db.Column(db.Integer)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/book', methods=['POST'])
def book_event():
    data = request.json
    name = data['name']
    email = data['email']
    event_type = data['eventType']
    date = data['date']
    guests = int(data['guests'])
    addons = data.get('addons', [])

    base_prices = {
        "Wedding": 200000,
        "Birthday Party": 50000,
        "Corporate Event": 120000,
        "Concert": 500000
    }
    base_cost = base_prices.get(event_type, 0)

    addon_prices = {
        "food": guests * 500,
        "decor": 5000,
        "drinks": 2000,
        "mic": 3000
    }
    addon_cost = sum([addon_prices[a] for a in addons if a in addon_prices])

    total_cost = base_cost + addon_cost

    booking = Booking(
        name=name,
        email=email,
        event_type=event_type,
        date=date,
        guests=guests,
        addons=",".join(addons),
        total_cost=total_cost
    )
    db.session.add(booking)
    db.session.commit()

    return jsonify({"message": "Booking stored!", "totalCost": total_cost})

@app.route('/search', methods=['POST'])
def search_event():
    date = request.json.get('date')
    events = Booking.query.filter_by(date=date).all()
    result = [{
        'name': e.name,
        'email': e.email,
        'eventType': e.event_type,
        'date': e.date,
        'guests': e.guests
    } for e in events]

    return jsonify(result)

@app.route('/cart', methods=['GET'])
def get_cart():
    bookings = Booking.query.all()
    result = [{
        'id' : b.id,
        'event': b.event_type,
        'addons': b.addons,
        'total_cost': b.total_cost
    } for b in bookings]
    return jsonify(result)

@app.route('/delete/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    db.session.delete(booking)
    db.session.commit()
    return jsonify({'status': 'success'}), 200

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        bookings = Booking.query.all()
        if not bookings:
            return jsonify({"error": "No bookings found"}), 400

        total = sum([b.total_cost for b in bookings])
        if total == 0:
            return jsonify({"error": "Total cost is zero"}), 400

        amount = total * 100

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'inr',
                    'product_data': {'name': 'Event Booking'},
                    'unit_amount': amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='http://localhost:5000/success',
            cancel_url='http://localhost:5000/cancel',
        )
        return jsonify({'id': session.id})
    except Exception as e:
        return jsonify(error=str(e)), 400

@app.route('/success')
def success():
    return "Payment successful! Thank you."

@app.route('/cancel')
def cancel():
    return "Payment cancelled. Try again."

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, threaded=True)
