const express = require('express');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// ✅ Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBnFZSsodEz07ax6YMKk-utXrylkxVNxec",
    authDomain: "addconferences-a374e.firebaseapp.com",
    databaseURL: "https://addconferences-a374e-default-rtdb.firebaseio.com",
    projectId: "addconferences-a374e",
    storageBucket: "addconferences-a374e.appspot.com",
    messagingSenderId: "681914308324",
    appId: "1:681914308324:web:a1eef793d96ab4b207fef1"
};

// ✅ Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// ✅ Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// ✅ Route: Get all cars grouped by category
app.get('/cars', async (req, res) => {
    try {
        const carsRef = ref(db, 'cars');
        const snapshot = await get(carsRef);
        
        if (snapshot.exists()) {
            const carsData = snapshot.val();
            res.json(carsData);
        } else {
            res.status(404).json({ error: "No cars found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Route: Show voting form for a specific car
app.get('/cars/:category/:model_no', async (req, res) => {
    try {
        const { category, model_no } = req.params;
        const carRef = ref(db, `cars/${category}/${model_no}`);
        const snapshot = await get(carRef);

        if (!snapshot.exists()) {
            return res.status(404).send("Car not found in this category.");
        }

        const carData = snapshot.val();

        res.send(`
            <html>
            <head>
                <title>Vote for ${category} ${model_no}</title>
            </head>
            <body>
                <h2>Vote for Car: ${category} ${model_no}</h2>
               

                <form action="/vote/${category}/${model_no}" method="POST">
                    <label>Car Message Rating:</label><br>
                    ${generateRadioButtons('message')}
                    
                    <label>Uniqueness Rating:</label><br>
                    ${generateRadioButtons('uniqueness')}
                    
                    <label>Art Quality Rating:</label><br>
                    ${generateRadioButtons('art_quality')}
                    
                    <br><br>
                    <button type="submit">Submit Vote</button>
                </form>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send("Error loading form.");
    }
});

// ✅ Route: Handle vote submission and update Firebase
app.post('/vote/:category/:model_no', async (req, res) => {
    try {
        const { category, model_no } = req.params;
        let { message, uniqueness, art_quality } = req.body;

        // Convert ratings to numbers
        message = parseInt(message) || 0;
        uniqueness = parseInt(uniqueness) || 0;
        art_quality = parseInt(art_quality) || 0;

        const carRef = ref(db, `cars/${category}/${model_no}/ratings`);
        const snapshot = await get(carRef);

        let existingRatings = snapshot.exists() ? snapshot.val() : { message: 0, uniqueness: 0, art_quality: 0, total_votes: 0 };

        // ✅ Sum up votes
        const updatedRatings = {
            message: existingRatings.message + message,
            uniqueness: existingRatings.uniqueness + uniqueness,
            art_quality: existingRatings.art_quality + art_quality,
            total_votes: existingRatings.total_votes + 1,
            total_score: existingRatings.message + existingRatings.uniqueness + existingRatings.art_quality + message + uniqueness + art_quality
        };

        // ✅ Update Firebase
        await update(carRef, updatedRatings);

        res.send(`
            <h2>✅ Vote Submitted!</h2>
            <p>Total Votes: ${updatedRatings.total_votes}</p>
            <p>Updated Ratings:</p>
            <ul>
                <li>Car Message: ${updatedRatings.message}</li>
                <li>Uniqueness: ${updatedRatings.uniqueness}</li>
                <li>Art Quality: ${updatedRatings.art_quality}</li>
                <li>Total Score: ${updatedRatings.total_score}</li>
            </ul>
            <a href="/cars/${category}/${model_no}">⬅ Go Back</a>
        `);
    } catch (error) {
        console.error("❌ Error saving vote:", error);
        res.status(500).send("Error saving vote");
    }
});

// ✅ Helper function to generate radio buttons
function generateRadioButtons(name) {
    let buttons = "";
    for (let i = 1; i <= 5; i++) {
        buttons += `<input type="radio" name="${name}" value="${i}" required> ${i} `;
    }
    return buttons + "<br><br>";
}

// ✅ Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
