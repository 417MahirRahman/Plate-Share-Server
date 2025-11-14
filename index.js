const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = 3000;

const admin = require("firebase-admin");
const serviceAccount = require("./serviceKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.8rpbzhd.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//middleware
const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "Token not found.",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).send({
      message: "Token not found.",
    });
  }
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //dataBase, Collection
    const database = client.db("Plate_Share");
    const foodCollection = database.collection("Foods");
    const foodRequestCollection = database.collection("Food_Request");

    // Get all available foods
    app.get("/availableFoods", async (req, res) => {
      const result = await foodCollection.find().toArray();

      res.send(result);
    });

    // Get a specific food by ID
    app.get("/availableFoods/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const food = await foodCollection.findOne({ _id: new ObjectId(id) });

      res.send({
        success: true,
        food,
      });
    });

    //Dynamic-Food
    app.get("/dynamicFood", async (req, res) => {
      const result = await foodCollection
        .find()
        .sort({ quantity: "desc" })
        .limit(6)
        .toArray();

      res.send(result);
    });

    // Get all foods posted by a specific user
    app.get("/myFood", verifyToken, async (req, res) => {
      const email = req.query.email;
      const result = await foodCollection
        .find({ donatorEmail: email })
        .toArray();

      res.send(result);
    });

    // Get food requests made by the user
    app.get("/FoodRequest", verifyToken, async (req, res) => {
      const result = await foodRequestCollection.find().toArray();

      res.send(result);
    });

    // Get a specific food request by ID
    app.get("/FoodRequest/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const food = await foodRequestCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send({
        success: true,
        food,
      });
    });

    // Get food requests sent by the user (as owner)
    app.get("/myFoodRequests/", verifyToken, (req, res) => {
      const email = req.query.email;
      if (!email)
        return res.send({ success: false, message: "Email is required" });

      foodRequestCollection
        .find({ Email: email })
        .toArray()
        .then((requests) => res.send({ success: true, requests }))
        .catch(() =>
          res.send({
            success: false,
            message: "Failed to retrieve food requests",
          })
        );
    });

    // Post a new available food
    app.post("/availableFoods", verifyToken,  async (req, res) => {
      const data = req.body;
      const result = await foodCollection.insertOne(data);

      res.send({
        success: true,
        result,
      });
    });

    // Post a new food request
    app.post("/FoodRequest", verifyToken, async (req, res) => {
      const data = {
        Name: req.body.Name,
        Email: req.body.Email,
        ImageURL: req.body.ImageURL,
        foodID: req.body.foodID,
        foodname: req.body.foodname,
        foodOwnerEmail: req.body.foodOwnerEmail,
        ContactNumber: req.body.ContactNumber,
        foodStatus: "Pending",
      };

      const result = await foodRequestCollection.insertOne(data);

      res.send({
        success: true,
        message: "Food request saved successfully",
        insertedId: result.insertedId,
      });
    });

    // Update an available food by ID
    app.put("/availableFoods/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const updatedData = {
        foodName: req.body.foodName,
        foodImage: req.body.foodImage,
        quantity: Number(req.body.quantity),
        pickupLocation: req.body.pickupLocation,
        expireDate: req.body.expireDate,
        additionalNote: req.body.additionalNote,
      };

      Object.keys(updatedData).forEach(
        (key) => updatedData[key] === undefined && delete updatedData[key]
      );

      const result = await foodCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updatedData },
        { returnDocument: "after" }
      );

      return res.send({
        success: true,
        message: "Food updated successfully",
        updatedFood: result.value,
      });
    });

    // Update FoodRequest status
    app.put("/FoodRequest/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const { foodStatus } = req.body;

      const objectId = new ObjectId(id);

      const result = await foodRequestCollection.findOneAndUpdate(
        { _id: objectId },
        { $set: { foodStatus } },
        { returnDocument: "after" }
      );

      res.send({ success: true, updatedRequest: result.value });
    });

    // Delete an available food by ID
    app.delete("/availableFoods/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };

      const result = await foodCollection.deleteOne(filter);

      res.send({
        success: true,
        result,
      });
    });

    // Delete an food-request food by ID
    app.delete("/FoodRequest/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };

      const result = await foodRequestCollection.deleteOne(filter);

      res.send({
        success: true,
        result,
      });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`The Server is Running on port ${port}`);
});
