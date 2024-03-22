const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middle ware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.taymcgi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const serviceCollection = client
      .db("offlineService")
      .collection("services");
    const manageCollection = client.db("offlineService").collection("manage");
    const bookingCollection = client.db("offlineService").collection("booking");

    // services related api
    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // manage services related api

    app.get("/manage", async (req, res) => {
      const cursor = manageCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/manage/:email", async (req, res) => {
      const email = req.params.email;
      const cursor = manageCollection.find({
        provider_email: email,
      });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/manageId/:id", async (req, res) => {
      const id = req.params.id;
      const cursor = await manageCollection.findOne({
        _id: new ObjectId(id),
      });
      // const result = await cursor.toArray();
      res.send(cursor);
    });

    app.post("/manage", async (req, res) => {
      console.log(req);
      const user = req.body;
      const result = await manageCollection.insertOne(user);
      res.send(result);
    });

    app.delete("/manage/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await manageCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/manage/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updateUser = req.body;
      const update = {
        $set: {
          name: updateUser.name,
          email: updateUser.email,
          service_img: updateUser.service_img,
          service_name: updateUser.service_name,
          service_price: updateUser.service_price,
          service_area: updateUser.service_area,
          service_des: updateUser.service_des,
        },
      };
      const result = await manageCollection.updateMany(filter, update, option);
      res.send(result);
    });

    // booking
    app.get("/booking", async (req, res) => {
      const cursor = bookingCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/booking/:email", async (req, res) => {
      const email = req.params.email;
      const cursor = bookingCollection.find({ userEmail: email });
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/pendingWork/:email", async (req, res) => {
      const email = req.params.email;
      const cursor = bookingCollection.find({ provider_email: email });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const result = await serviceCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // booking
    app.post("/booking", async (req, res) => {
      console.log(req);
      const user = req.body;
      console.log(user);
      const result = await bookingCollection.insertOne(user);
      res.send(result);
    });

   

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});
app.listen(port, () => {
  console.log(`my server is running on:${port}`);
});
