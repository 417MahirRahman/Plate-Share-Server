const express = require('express')
const cors = require('cors')
require("dotenv").config()
const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.8rpbzhd.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //dataBase, Collection
    const dataBase = client.db('Plate_Share')
    const foodCollection = dataBase.collection('Foods')

    app.get('/availableFoods', async(req, res) => {
        
        const result = await foodCollection.find().toArray()

        res.send(result)
    })

    app.get('/demo/:id', async(req, res) => {
        const {id} = req.params
        const result = await collection.findOne({_id: new ObjectId(id)}).toArray()

        res.send({
            success: true,
            result
        })
    })

    app.post('', async(req, res) => {
        const data = req.body
        const result = await collection.insertOne(data)

        res.send({
            success: true,
            result
        })
    })

    app.put('/demo/:id', async(req, res) => {
        const {id} = req.params
        const data = req.body
        const objectId = new ObjectId(id)

        const filter = {_id: objectId}
        const update = {
            $set: data
        }
        const result = await collection.updateOne({filter, update})

        res.send({
            success: true,
            result
        })
    })

    app.delete('/demo/id', async(req, res) => {
        const {id} = req.params
        const objectId = new ObjectId(id)
        const filter = {_id: objectId}

        const result = await collection.deleteOne({filter})

        req.send({
            success: true,
            result
        })
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(port, () => {
  console.log(`The Server is Running on port ${port}`)
})
