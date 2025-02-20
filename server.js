const express = require('express');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');
const bodyParser = require('body-parser');

const app = express();

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

// ✅ API Routes
app.get('/api/cars', async (req, res) => {
    try {
        const carsRef = ref(db, 'cars');
        const snapshot = await get(carsRef);
        
        if (snapshot.exists()) {
            res.json(snapshot.val());
        } else {
            res.status(404).json({ error: "No cars found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/cars/:category/:model_no', async (req, res) => {
    try {
        const { category, model_no } = req.params;
        const carRef = ref(db, `cars/${category}/${model_no}`);
        const snapshot = await get(carRef);

        if (!snapshot.exists()) {
            return res.status(404).json({ error: "Car not found" });
        }

        res.json(snapshot.val());
    } catch (error) {
        res.status(500).json({ error: "Error loading car details" });
    }
});

app.post('/api/vote/:category/:model_no', async (req, res) => {
    try {
        const { category, model_no } = req.params;
        let { message, uniqueness, art_quality } = req.body;

        message = parseInt(message) || 0;
        uniqueness = parseInt(uniqueness) || 0;
        art_quality = parseInt(art_quality) || 0;

        const carRef = ref(db, `cars/${category}/${model_no}/ratings`);
        const snapshot = await get(carRef);

        let existingRatings = snapshot.exists() ? snapshot.val() : { message: 0, uniqueness: 0, art_quality: 0, total_votes: 0 };

        const updatedRatings = {
            message: existingRatings.message + message,
            uniqueness: existingRatings.uniqueness + uniqueness,
            art_quality: existingRatings.art_quality + art_quality,
            total_votes: existingRatings.total_votes + 1,
            total_score: existingRatings.message + existingRatings.uniqueness + existingRatings.art_quality + message + uniqueness + art_quality
        };

        await update(carRef, updatedRatings);
        res.json({ success: true, updatedRatings });
    } catch (error) {
        res.status(500).json({ error: "Error saving vote" });
    }
});

// ✅ Export Express app for Vercel (❗ No app.listen)
module.exports = app;
