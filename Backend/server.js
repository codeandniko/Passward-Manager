/* global process */

import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import { Buffer } from 'buffer';

// or as an es module:
// import { MongoClient } from 'mongodb'
dotenv.config()

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Namenpm i dotenv

const dbName = 'Passop';
const app = express()
const port = 3000
app.use(bodyParser.json())
app.use(cors())

const ENCRYPTION_KEY = crypto.scryptSync(process.env.SECRET_KEY || 'default_secret', 'salt', 32); // Must be 32 bytes for AES-256
const IV = Buffer.alloc(16, 0); // Initialization vector (can be random but must be 16 bytes)

const encrypt = (text) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encrypted) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};


client.connect();


app.get('/', async (req, res) => {
  const db = client.db(dbName);
  const collection = db.collection('passwoards');
  const findResult = await collection.find({}).toArray();

  const decryptedPasswords = findResult.map(item => ({
    ...item,
    password: item.password ? decrypt(item.password) : ''
  }));

  res.json(decryptedPasswords);
});


app.post('/', async (req, res) => {
  const password = req.body;

  if (password.password) {
    password.password = encrypt(password.password);
  }

  const db = client.db(dbName);
  const collection = db.collection('passwoards');
  const result = await collection.insertOne(password);
  res.send({ success: true, result });
});

app.delete('/', async(req, res) => {
  const passward = req.body
  const db = client.db(dbName);
  const collection = db.collection('passwoards'); 
    const findResult = await collection.deleteOne(passward);
  res.send({sucess: true,result: findResult})
})

app.listen(port, () => {
  console.log(`Example app listening on      http://localhost:${port}`)
})  
