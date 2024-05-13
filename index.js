const express = require("express");
require("dotenv").config();

const cors = require('cors');



const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
//Must remove "/" from your production URL
app.use(
    cors({
      origin: [
        "http://localhost:5174",
       
      ],
      credentials: true,
    })
  );
app.use(express.json());

console.log(process.env.DB_PASS)
console.log(process.env.DB_USER)

const uri =
  "mongodb+srv://foodStation:RhpR3AYCleJmofUD@cluster0.s8jaol5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  // next();
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const userCollection = client.db("foodStation").collection("users");
    const foodCollection = client.db("foodStation").collection("food");

    app.post("/jwt", async (req, res) => {
      const logged = req.body;
      console.log("user for token", logged);
      const token = jwt.sign(logged, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // app.post("/logout", async (req, res) => {
    //   const logged = req.body;
    //   console.log("logging out", logged);
    //   res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    // });

    //user related api
    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Food related API
    app.get("/food", async (req, res) => {
      const userEmail = req.query.email;

      try {
        let query = {};
        if (userEmail) {
          query = { email: userEmail };
        }

        const foods = await foodCollection.find(query).toArray();

        res.send(foods);
      } catch (error) {
        console.error("Error fetching food data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.post("/food", async (req, res) => {
      const food = req.body;
      const result = await foodCollection.insertOne(food);
      res.send(result);
    });
    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const food = await foodCollection.findOne(query);
      console.table(food);
      res.send(food);
    });

    // app.patch("/food/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const updatedFood = req.body;
    //   const updatedDoc = {
    //     $set: {
    //       status: updatedFood.status,
    //     },
    //   };
    //   const food = await foodCollection.updateOne(query, updatedDoc);
    //   res.send(food);
    // });

    app.put('/foods/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const options = { upset: true };
        const updatedProduct = req.body;
        const food = {
          $set: {
            foodName: updatedProduct.foodName,
            foodCategory: updatedProduct.foodCategory,
            quantity: updatedProduct.quantity,
            origin: updatedProduct.origin,
            price: updatedProduct.price,
            descriptions: updatedProduct.descriptions,
          }
        }
        const result = await foodCollection.updateOne(filter, food, options);
        res.send(result);
      })
    
    app.delete("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const food = await foodCollection.deleteOne(query);

      res.send(food);
    });

    // app.delete('/food/:id', async(req, res) =>{
    //     const id = req.params.id;
    //     const query = {_id: new ObjectId(id)};
    //     const result = await foodCollection.deleteOne(query);
    //     res.send(result);
    //   })




  } catch (err) {
    console.error("Error during MongoDB operations:", err);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("food is coming");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
