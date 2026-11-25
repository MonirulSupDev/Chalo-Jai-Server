const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

initializeApp({
    credential: cert(serviceAccount),
});
const { MongoClient, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();
app.use(cors({
    origin: [
        "https://chalo-jai-server.vercel.app",
        "https://chalo-jai-server-git-main-monirul4.vercel.app",
        "http://localhost:5173", // keep for local development
    ],
}));
app.use(express.json());


const client = new MongoClient(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-yaazx3y-shard-00-00.rdmmvfx.mongodb.net:27017,ac-yaazx3y-shard-00-01.rdmmvfx.mongodb.net:27017,ac-yaazx3y-shard-00-02.rdmmvfx.mongodb.net:27017/?ssl=true&replicaSet=atlas-ijjem0-shard-0&authSource=admin`);

const spotCollection = client.db("chaloJai").collection("spots");
const userCollection = client.db("chaloJai").collection("users");

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");

        // Add tourists spot to database
        app.post("/add-tourists-spot", async (req, res) => {
            const spot = req.body;
            const result = await spotCollection.insertOne(spot);
            res.send(result);
        })

        // Get all tourists spots
        app.get("/all-tourists-spot", async (req, res) => {
            const spots = spotCollection.find();
            const result = await spots.toArray();
            res.send(result);
        })

        // Get a specefic tourists spot
        app.get("/all-tourists-spot/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const spot = await spotCollection.findOne(query);
            res.send(spot);
        })

        // Update tourists spot
        app.put("/update-tourists-spot/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedSpot = req.body;
            const spot = {
                $set: {
                    imageUrl: updatedSpot.imageUrl,
                    spotName: updatedSpot.spotName,
                    countryName: updatedSpot.countryName,
                    location: updatedSpot.location,
                    averageCost: updatedSpot.averageCost,
                    seasonality: updatedSpot.seasonality,
                    travelTime: updatedSpot.travelTime,
                    totalVisitors: updatedSpot.totalVisitors,
                    userEmail: updatedSpot.userEmail,
                    userName: updatedSpot.userName,
                    description: updatedSpot.description,
                }
            };
            const result = await spotCollection.updateOne(filter, spot, options);
            res.send(result);
        })

        // Delete a spot
        app.delete("/all-tourists-spot/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await spotCollection.deleteOne(query);
            res.send(result);
        })

        // Creating User
        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        // Verifying firebase ID token  and showing logged in user's data

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

        app.get("/my-spots", verifyToken, async (req, res) => {
            // use the email from the verified token, not from the URL
            const result = await spotCollection
                .find({ userEmail: req.user.email })
                .toArray();
            res.send(result);
        });

        return client;
    } catch (err) {
        console.dir(err);
    }
}
connectToMongoDB();


app.get("/", (req, res) => {
    res.send("Yaaaa....Chalo Jai server is running...!!!");
})

// Start the Express server only if this file is being executed directly, not when it is imported into another file.
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Chalo Jai server is running on port: ${port}`);
    })
}

module.exports = app; // required by vercel