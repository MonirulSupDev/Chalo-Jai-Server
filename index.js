const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { MongoClient, ObjectId } = require('mongodb');

const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);
initializeApp({ credential: cert(serviceAccount) });

const port = process.env.PORT || 5000;
const app = express();

app.use(cors({
    origin: [
        "https://chalojai-534f1.web.app",
        "https://chalojai-534f1.firebaseapp.com",
        "http://localhost:5173", // local development
    ],
}));
app.use(express.json());

const user = encodeURIComponent(process.env.DB_USER);
const pass = encodeURIComponent(process.env.DB_PASS);
const client = new MongoClient(
    `mongodb://${user}:${pass}@ac-yaazx3y-shard-00-00.rdmmvfx.mongodb.net:27017,ac-yaazx3y-shard-00-01.rdmmvfx.mongodb.net:27017,ac-yaazx3y-shard-00-02.rdmmvfx.mongodb.net:27017/?ssl=true&replicaSet=atlas-ijjem0-shard-0&authSource=admin`
);

const spotCollection = client.db("chaloJai").collection("spots");
const userCollection = client.db("chaloJai").collection("users");

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send({ message: "Unauthorized" });
    try {
        req.user = await getAuth().verifyIdToken(token);
        next();
    } catch {
        res.status(401).send({ message: "Invalid token" });
    }
};

app.get("/", (req, res) => {
    res.send("Yaaaa....Chalo Jai server is running...!!!");
});

// Add tourist spot
app.post("/add-tourists-spot", verifyToken, async (req, res) => {
    try {
        const result = await spotCollection.insertOne(req.body);
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err.message });
    }
});

// Get all tourist spots
app.get("/all-tourists-spot", async (req, res) => {
    try {
        const result = await spotCollection.find().toArray();
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err.message });
    }
});

// Get one tourist spot
app.get("/all-tourists-spot/:id", async (req, res) => {
    try {
        const spot = await spotCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.send(spot);
    } catch (err) {
        console.error(err);
        res.status(400).send({ message: "Invalid ID or server error" });
    }
});

// Update tourist spot
app.put("/update-tourists-spot/:id", verifyToken, async (req, res) => {
    try {
        const filter = { _id: new ObjectId(req.params.id) };
        const u = req.body;
        const spot = {
            $set: {
                imageUrl: u.imageUrl,
                spotName: u.spotName,
                countryName: u.countryName,
                location: u.location,
                averageCost: u.averageCost,
                seasonality: u.seasonality,
                travelTime: u.travelTime,
                totalVisitors: u.totalVisitors,
                userEmail: u.userEmail,
                userName: u.userName,
                description: u.description,
            },
        };
        const result = await spotCollection.updateOne(filter, spot, { upsert: true });
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(400).send({ message: "Invalid ID or server error" });
    }
});

// Delete a spot
app.delete("/all-tourists-spot/:id", verifyToken, async (req, res) => {
    try {
        const result = await spotCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(400).send({ message: "Invalid ID or server error" });
    }
});

// Create user
app.post("/users", async (req, res) => {
    try {
        const result = await userCollection.insertOne(req.body);
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err.message });
    }
});

// Logged-in user's spots
app.get("/my-spots", verifyToken, async (req, res) => {
    try {
        const result = await spotCollection.find({ userEmail: req.user.email }).toArray();
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err.message });
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Chalo Jai server is running on port: ${port}`);
    });
}

module.exports = app; // required by vercel