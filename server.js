const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

const PORT = process.env.PORT || 3000;

const SECRET =
  process.env.JWT_SECRET ||
  'troque-esta-chave-em-producao';

const DB =
  path.join(__dirname, 'data.json');


/* BANCO */

if (!fs.existsSync(DB)) {

  fs.writeFileSync(
    DB,
    JSON.stringify(
      {
        users: [],

        products: [
          {
            id: 1,
            name: '50K DINHEIRO SERV 20',
            price: 15,
            stock: 10
          },
          {
            id: 2,
            name: '100K DINHEIRO SERV 20',
            price: 30,
            stock: 10
          },
          {
            id: 3,
            name: '200K DINHEIRO SERV 20',
            price: 60,
            stock: 10
          }
        ],

        orders: []
      },
      null,
      2
    )
  );

}


const db = () =>
  JSON.parse(
    fs.readFileSync(DB, 'utf8')
  );


const save = data =>
  fs.writeFileSync(
    DB,
    JSON.stringify(data, null, 2)
  );


app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, 'public')
  )
);


/* AUTENTICAÇÃO */

function auth(req, res, next) {

  try {

    const token =
      (req.headers.authorization || '')
        .replace('Bearer ', '');

    req.user =
      jwt.verify(token, SECRET);

    next();

  } catch {

    res.status(401).json({
      error: 'Não autenticado'
    });

  }

}


function admin(req, res, next) {

  if (req.user?.role !== 'admin') {

    return res.status(403).json({
      error: 'Acesso negado'
    });

  }

  next();

}


/* CADASTRO */

app.post(
  '/api/register',
  async (req, res) => {

    const {
      name,
      email,
      password
    } = req.body || {};


    if (!name || !email || !password) {

      return res.status(400).json({
        error: 'Preencha tudo'
      });

    }


    const data = db();


    if (
      data.users.some(
        user =>
          user.email ===
          email.toLowerCase()
      )
    ) {

      return res.status(409).json({
        error: 'E-mail já cadastrado'
