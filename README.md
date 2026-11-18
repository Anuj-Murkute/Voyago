# 🌍 VOYAGO — AI-Powered Smart Travel Planner

*Plan smarter. Travel better. Explore more.*

VOYAGO is an AI-powered travel planning web application designed to simplify the way people plan their trips. It combines generative AI, real-world location services, interactive maps, and personalized recommendations to create a smarter travel planning experience.

Instead of switching between multiple platforms to organize a trip, users can explore destinations, generate personalized itineraries, discover hotels and restaurants, and manage their travel plans in one place.

---

## ✨ Features

- **AI-Powered Itinerary Generation:** Generate personalized travel itineraries using Google Gemini based on destination, travel dates, budget, number of travelers, and interests.
- **Interactive Maps:** Explore travel destinations and visualize itinerary locations using Google Maps.
- **Real-World Location Integration:** Resolve recommended places using Google Places API.
- **Hotel Discovery:** Explore accommodation options for planned trips.
- **Restaurant Discovery:** Discover restaurants and dining options at your destination.
- **User Authentication:** Secure registration and login using JWT and password hashing.
- **Trip Management:** Create, save, view, and manage travel plans.
- **Responsive User Interface:** A modern interface designed to make trip planning intuitive.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, JavaScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI Integration | Google Gemini API |
| Maps | Google Maps API, Google Places API |
| Authentication | JSON Web Token (JWT), bcrypt |
| API Communication | REST APIs |
| Development Tools | Git, GitHub, VS Code, Vite |

---

## 🏗️ Project Architecture

VOYAGO follows a client-server architecture.

```text
                 VOYAGO
                    |
          +---------+---------+
          |                   |
       FRONTEND             BACKEND
          |                   |
       React.js             Node.js
          |                   |
       Vite UI              Express.js
          |                   |
          +-------- REST APIs+
                    |
          +---------+----------+
          |         |          |
       MongoDB    Gemini     Google Maps
       Database    API       & Places API
```

### Application Flow

1. Users register or log in.
2. Users enter their trip preferences.
3. The backend processes the trip request.
4. Gemini generates a personalized itinerary.
5. Google Maps and Places services help identify real-world locations.
6. Trip information is stored in MongoDB.
7. Users can revisit and manage their saved trips.

---

## 📂 Project Structure

```text
VOYAGO/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

Follow these steps to run VOYAGO locally.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/VOYAGO.git
```

```bash
cd VOYAGO
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Setup the Backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory.

Configure the following environment variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Setup the Frontend

Open another terminal:

```bash
cd client
npm install
```

Create a `.env` file inside the `client` directory.

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Use the variable names expected by your actual application configuration. If your deployment uses a different API URL, configure that accordingly.

### 4. Run the Application

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the local URL provided by Vite in your browser.

---

## 🔐 Environment Variables

VOYAGO requires API credentials and database configuration to run.

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used for JWT authentication |
| `GEMINI_API_KEY` | Google Gemini API key |
| `VITE_API_URL` | Backend API base URL |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps browser API key |

**Important:** Never commit `.env` files, API keys, database credentials, or JWT secrets to GitHub.

---

## 🧠 AI Integration

VOYAGO uses Google's Gemini API to generate personalized travel itineraries.

The AI-powered planning process considers:

- Destination
- Travel dates
- Number of travelers
- Budget preferences
- User interests
- Travel preferences

The generated itinerary is then integrated with real-world location services to make travel planning more practical.

---

## 🔮 Future Improvements

Potential areas for further development:

- Advanced itinerary customization and optimization.
- Improved route planning and travel-time estimation.
- Flight, train, bus, and cruise discovery.
- External booking provider integration.
- User profiles and saved favourite destinations.
- Collaborative trip planning.
- Enhanced budget tracking.

---

## 🎯 Project Objective

The primary objective of VOYAGO is to demonstrate how modern full-stack technologies and generative AI can be combined to solve a real-world problem.

The project provided practical experience in:

- Full-stack web development.
- REST API design and integration.
- Database modeling and management.
- Authentication and authorization.
- Third-party API integration.
- Generative AI integration.
- Building user-focused applications.

---

## 👨‍💻 Developer

**Anuj Murkute**

B.Tech Information Technology Student

Interested in Full-Stack Development, Data Structures & Algorithms, and Artificial Intelligence.

---

## ⭐ Support

If you find this project interesting, consider giving the repository a ⭐ on GitHub!

**VOYAGO — Your journey, intelligently planned.** 🌍
