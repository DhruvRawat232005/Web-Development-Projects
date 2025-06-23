const BACKEND_URL = 'http://127.0.0.1:5000';

// Show the selected page and hide others
function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.style.display = 'none');

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.style.display = 'block';
    if (pageId === 'cart') {
      loadCart();
    }
  }
}

// Handle booking form submission by sending data to backend API
document.addEventListener('DOMContentLoaded', function () {
  showPage('home'); // Show home on initial load

  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const eventType = document.getElementById('eventType').value;
      const date = document.getElementById('date').value;
      const guests = parseInt(document.getElementById('guests').value);

      const addons = [];
      const checkboxes = bookingForm.querySelectorAll('input[type="checkbox"]:checked');
      checkboxes.forEach(cb => addons.push(cb.value));

      const booking = { name, email, eventType, date, guests, addons };

      try {
        const response = await fetch(`${BACKEND_URL}/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();

        document.getElementById('formMessage').textContent = `Booking successful! Total cost: ₹${result.totalCost}`;

        bookingForm.reset();
        showPage('home');

      } catch (error) {
        console.error('Booking failed:', error);
        document.getElementById('formMessage').textContent = 'Booking failed. Please try again.';
      }
    });
  }
});

// Handle event search
function searchEvents() {
  const searchDate = document.getElementById('searchDate').value;
  const resultDiv = document.getElementById('eventResults');
  resultDiv.innerHTML = '';

  // Fetch events from backend API based on date
  fetch(`${BACKEND_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: searchDate })
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`Error fetching events: ${res.status}`);
    }
    return res.json();
  })
  .then(events => {
    if (events.length === 0) {
      resultDiv.innerHTML = '<p>No events found for that date.</p>';
      return;
    }

    events.forEach(event => {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <h3>${event.eventType}</h3>
        <p><strong>Name:</strong> ${event.name}</p>
        <p><strong>Email:</strong> ${event.email}</p>
        <p><strong>Date:</strong> ${event.date}</p>
        <p><strong>Guests:</strong> ${event.guests}</p>
      `;
      resultDiv.appendChild(card);
    });
  })
  .catch(err => {
    console.error(err);
    resultDiv.innerHTML = '<p>Failed to load events. Please try again.</p>';
  });
}

async function loadCart() {
  const cartDiv = document.getElementById('cartItems');
  const payBtn = document.getElementById('payBtn');
  if (!cartDiv) return;

  cartDiv.innerHTML = 'Loading cart...';
  try {
    const response = await fetch(`${BACKEND_URL}/cart`);
    const bookings = await response.json();

    if (bookings.length === 0) {
      cartDiv.innerHTML = '<p>Your cart is empty.</p>';
      payBtn.style.display = 'none';
      return;
    }

    cartDiv.innerHTML = '';
    bookings.forEach((b) => {
      const item = document.createElement('div');
      item.className = 'cart-item';
      item.innerHTML = `
        <h4>Event: ${b.event}</h4>
        <p><strong>Add-ons:</strong> ${b.addons || 'None'}</p>
        <p><strong>Total Cost:</strong> ₹${b.total_cost}</p>
        <button class="removeBtn" data-id="${b.id}" style="background-color:red; color:white; border:none; padding:5px 10px; border-radius:4px;">Remove</button>
        <hr/>
      `;
      cartDiv.appendChild(item);
    });

    // Attach remove button handlers
    document.querySelectorAll('.removeBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const confirmDelete = confirm('Are you sure you want to remove this booking?');
        if (!confirmDelete) return;

        const res = await fetch(`${BACKEND_URL}/delete/${id}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          alert('Booking removed!');
          loadCart(); // Refresh cart
        } else {
          alert('Failed to remove booking.');
        }
      });
    });

    payBtn.style.display = 'inline-block'; // Show Razorpay button
  } catch (error) {
    console.error('Cart load failed:', error);
    cartDiv.innerHTML = '<p>Failed to load cart.</p>';
    payBtn.style.display = 'none';
  }
}

const payBtn = document.getElementById('payBtn');

if (payBtn) {
  payBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const session = await response.json();

      if (session.id) {
        const stripe = Stripe('pk_test_51RWG9FB7bjw5YCkrPkTTpXmfjV1yAEKwCvIT63DvsyxHChWINjx1OfkatfbKILKKf4umyk842PA2QJarsBjhXN8h003QE5QUak');
        stripe.redirectToCheckout({ sessionId: session.id });
      } else {
        alert("Payment session creation failed.");
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      alert("Payment failed to initialize.");
    }
  });
}
