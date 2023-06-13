const express = require("express");
const app = express();
const jwt = require('jsonwebtoken');
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());


const verifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'});
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })
}





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zlgqora.mongodb.net/?retryWrites=true&w=majority`;

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

    const usersCollection = client.db("assignment-12").collection("users");
    const classCollection = client.db("assignment-12").collection("class");
    const instructorCollection = client.db("assignment-12").collection("instructor");
    const selectedClassCollection = client.db("assignment-12").collection("selectedClass");
    const pendingClassCollection = client.db("assignment-12").collection("pendingClass");


    app.post('/jwt', (req,res)=>{
      const user= req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({token})
    })
    const verifyAdmin = async(req, res, next)=>{
      const email = req.decoded.email;
      const query = {email: email}
      const user = await usersCollection.findOne(query);
      if(user?.role !== 'admin'){
        return res.status(403).send({error: true, message: 'forbidden access'});
      }
      next();
    }


    // USER CODES..........

    app.get('/users',verifyJWT,verifyAdmin, async(req,res)=>{
      const result = await usersCollection.find().toArray();
      res.send(result);      
    })

    app.patch('/users/admin/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id:new ObjectId(id)}
      const updateRole = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter,updateRole);
      res.send(result);
    })

    app.get('/users/admin/:email',verifyJWT, async(req,res)=>{
      const email = req.params.email;
      if(req.decoded.email !== email){
        res.send({admin: false})
      }

      const query= {email:email}
      const user = await usersCollection.findOne(query);
      const result = {admin: user?.role === 'admin'}
      res.send(result);
    })
    app.get('/users/instructor/:email',verifyJWT, async(req,res)=>{
      const email = req.params.email;
      if(req.decoded.email !== email){
        res.send({instructor: false})
      }

      const query= {email:email}
      const user = await usersCollection.findOne(query);
      const result = {instructor: user?.role === 'instructor'}
      res.send(result);
    })
    app.get('/users/user/:email',verifyJWT, async(req,res)=>{
      const email = req.params.email;
      if(req.decoded.email !== email){
        res.send({user: false})
      }

      const query= {email:email}
      const user = await usersCollection.findOne(query);
      const result = {user: user?.role === 'user'}
      res.send(result);
    })

    app.patch('/users/instructor/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id:new ObjectId(id)}
      const updateRole = {
        $set: {
          role: 'instructor'
        },
      };
      const result = await usersCollection.updateOne(filter,updateRole);
      res.send(result);
    })


    app.post('/users',  async(req,res)=>{
      const user = req.body; 
      const query = {email: user.email}
      const existingUser = await usersCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'user already exists'});
      }
      console.log(user);

      const result = await usersCollection.insertOne(user);
      res.send(result);
    })





    //classes codee...........

    app.get('/classes', async(req,res)=>{
        const result = await classCollection.find().toArray();
        res.send(result);
    })
    app.get('/newClass',verifyJWT,verifyAdmin, async(req,res)=>{
        const result = await pendingClassCollection.find().toArray();
        res.send(result);
    })
    app.post('/newClass', verifyJWT, async(req,res)=>{
      const newClass= req.body;
      const result = await pendingClassCollection.insertOne(newClass)
      res.send(result);
    })

    app.get('/newClass', verifyJWT, async(req,res) => {
      const email = req.query.email;
      console.log(email);
      
      if(!email){
        res.send([]);
      }

      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(403).send({error: true, message: 'forbidden access'})
      }

      const query = { email: email };
      const result = await pendingClassCollection.find(query).toArray()
      res.send(result);
    })







    app.get('/instructor', async(req,res)=>{
        const result = await instructorCollection.find().toArray();
        res.send(result);
    })




    //selected class code


    app.get('/selectedClass', verifyJWT, async(req,res) => {
      const email = req.query.email;
      console.log(email);
      
      if(!email){
        res.send([]);
      }

      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(403).send({error: true, message: 'forbidden access'})
      }

      const query = { email: email };
      const result = await selectedClassCollection.find(query).toArray()
      res.send(result);
    })

    app.post('/selectedClass', async(req,res)=>{
      const data = req.body;
      console.log(data);

      const result = await selectedClassCollection.insertOne(data);
      res.send(result);
    })

    app.delete('/selectedClass/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await selectedClassCollection.deleteOne(query);
      res.send(result);
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





app.get("/", (req, res) => {
  res.send("Assignment-12 is running");
});

app.listen(port, () => {
  console.log(`Assignment-12 is running on port ${port} `);
});
