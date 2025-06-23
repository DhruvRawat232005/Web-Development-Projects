# EventEase - Event Booking Web Application

EventEase is a modern, interactive event booking web app built with **Flask**, **HTML/CSS/JavaScript**, **SQLite**, and integrated with **Stripe** for secure payment processing.

## Features

- **Home Page**: Beautiful landing page with a price table for different event types.
- **Book an Event**: Users can fill out a form to book various types of events with optional add-ons.
- **Search Events**: Search all booked events by a specific date.
- **Cart View**: View all current bookings like a cart and pay via Stripe.
- **Stripe Payments**: Secure online payments with test integration.
- **Delete Bookings**: Remove any booking from the cart.
- **Contact Section**: Display developer contact details.

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Python, Flask
- **Database**: SQLite
- **Payment Gateway**: Stripe
- **REST API**: JSON-based communication
- **CORS**: Handled via `Flask-CORS` for frontend-backend communication


## How to Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/EventEase.git
cd EventEase

### 2. Set Up a Virtual Environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

### 3. Install Dependencies
pip install flask flask_sqlalchemy flask_cors stripe

### 4. Run the App
python app.py
