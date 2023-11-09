const express = require('express')
const cors =require ('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser=require('cookie-parser')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middle ware
app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true

}))
app.use(express.json());
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.taymcgi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middleWare
const logger =async(req, res, next)=>{
  console.log('log:info',req.method, req.url);
  next()
}

const verifyToken =async(req, res, next)=>{
  const token = req.cookies?.token;
  // console.log('value of token in middleware', token);
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode)=>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.user=decode;
    next();
  })
 
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection =client.db('offlineService').collection('services');
    const bookingCollection =client.db('offlineService').collection('booking');

    // auth related api
    app.post("/jwt", async(req, res)=>{
      const user =req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: 1});
      res.cookie('token', token,{
        httpOnly: true,
        secure: false
      }).send({success: true})
    } )

    app.post('/logout', async(req, res)=>{
      const user = req.body;
      console.log('logging out', user)
      res.clearCookie('token', {maxAge: 0}).send({success: true})
    })

    



    // services related api
    app.get('/services', async(req, res)=>{
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result)

    })
    // booking
    app.get('/booking', logger, verifyToken, async(req, res)=>{
      console.log(req.query.email)
      console.log('token owner info',req.user)
      if(req.user?.email !== req.query.email){
        return res.status(403).send({message: 'forbidden access'})
      }
      const cursor = bookingCollection.find();
      const result = await cursor.toArray();
      res.send(result)

    })

    app.get('/booking/:email', async(req, res)=>{
      const email = req.params.email;
      const cursor =  bookingCollection.find({userEmail:email});
      const result = await cursor.toArray();
      res.send(result)

    })
    app.get('/pendingWork/:email', async(req, res)=>{
      const email = req.params.email;
      const cursor =  bookingCollection.find({provider_email:email});
      const result = await cursor.toArray();
      res.send(result)

    })

    app.get('/services/:id', async(req, res)=>{
      const id = req.params.id;
      const result =await serviceCollection.findOne({_id: new ObjectId(id)});
      res.send(result)

    })

    
    app.post('/services', async(req, res)=>{
      console.log(req)
      const user = req.body;
      const result =await serviceCollection.insertOne(user);
      res.send(result)
    })

    // booking
    app.post('/booking', async(req, res)=>{
      console.log(req)
      const user = req.body;
      console.log(user)
      const result =await bookingCollection.insertOne(user);
      res.send(result)
    })

    app.patch('/services/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const option = {upsert: true};
      const updateUser = req.body;
      const update ={
        $set:{
          name : updateUser.name,
          email : updateUser.email,
          service_img : updateUser.service_img,
          service_name : updateUser.service_name,
          service_price : updateUser.service_price,
          service_area : updateUser.service_area,
          service_des : updateUser.service_des,
        }
      }
      const result = await serviceCollection.updateMany(filter, update, option);
      res.send(result)

    })


    app.delete('/services/:id', async(req, res)=>{
      const id = req.params.id;
      const query ={_id: new ObjectId(id)};
      const result = await serviceCollection.deleteOne(query);
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('server is running')
})
app.listen(port, ()=>{
    console.log(`my server is running on:${port}`)
})
