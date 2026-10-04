const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

const SECRET =
  process.env.JWT_SECRET ||
  'troque-esta-chave-em-producao';

const DB =
  path.join('/tmp', 'data.json');


/* BANCO */

function createDatabase() {

  return {
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
  };

}


function db() {

  try {

    if (!fs.existsSync(DB)) {

      fs.writeFileSync(
        DB,
        JSON.stringify(
          createDatabase(),
          null,
          2
        )
      );

    }

    return JSON.parse(
      fs.readFileSync(DB, 'utf8')
    );

  } catch (error) {

    console.error(
      'ERRO AO LER BANCO:',
      error
    );

    return createDatabase();

  }

}


function save(data) {

  try {

    fs.writeFileSync(
      DB,
      JSON.stringify(
        data,
        null,
        2
      )
    );

  } catch (error) {

    console.error(
      'ERRO AO SALVAR BANCO:',
      error
    );

    throw error;

  }

}


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
      jwt.verify(
        token,
        SECRET
      );

    next();

  } catch {

    res.status(401).json({
      error: 'Não autenticado'
    });

  }

}


function admin(req, res, next) {

  if (
    req.user?.role !== 'admin'
  ) {

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

    try {

      const {
        name,
        email,
        password
      } = req.body || {};


      if (
        !name ||
        !email ||
        !password
      ) {

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
          error:
            'E-mail já cadastrado'
        });

      }


      const user = {

        id: Date.now(),

        name,

        email:
          email.toLowerCase(),

        hash:
          await bcrypt.hash(
            password,
            10
          ),

        role: 'user'

      };


      data.users.push(user);

      save(data);


      res.json({

        token:
          jwt.sign(
            {
              id: user.id,
              name: user.name,
              role: user.role
            },
            SECRET
          ),

        name:
          user.name

      });

    } catch (error) {

      console.error(
        'ERRO NO CADASTRO:',
        error
      );

      res.status(500).json({
        error:
          'Erro ao criar conta.'
      });

    }

  }
);


/* LOGIN */

app.post(
  '/api/login',
  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body || {};


      const data = db();


      const user =
        data.users.find(
          user =>
            user.email ===
            String(
              email || ''
            ).toLowerCase()
        );


      if (
        !user ||
        !(await bcrypt.compare(
          password || '',
          user.hash
        ))
      ) {

        return res.status(401).json({
          error:
            'E-mail ou senha inválidos'
        });

      }


      res.json({

        token:
          jwt.sign(
            {
              id: user.id,
              name: user.name,
              role: user.role
            },
            SECRET
          ),

        name:
          user.name,

        role:
          user.role

      });

    } catch (error) {

      console.error(
        'ERRO NO LOGIN:',
        error
      );

      res.status(500).json({
        error:
          'Erro ao fazer login.'
      });

    }

  }
);


/* PRODUTOS */

app.get(
  '/api/products',
  (req, res) => {

    try {

      res.json(
        db().products
      );

    } catch (error) {

      console.error(
        'ERRO NOS PRODUTOS:',
        error
      );

      res.status(500).json({
        error:
          'Erro ao carregar produtos.'
      });

    }

  }
);


/* USUÁRIO */

app.get(
  '/api/me',
  auth,
  (req, res) => {

    res.json(
      req.user
    );

  }
);


/* PEDIDOS */

app.get(
  '/api/orders',
  auth,
  (req, res) => {

    try {

      const data = db();


      res.json(
        data.orders.filter(
          order =>
            req.user.role === 'admin' ||
            order.userId === req.user.id
        )
      );

    } catch (error) {

      console.error(
        'ERRO NOS PEDIDOS:',
        error
      );

      res.status(500).json({
        error:
          'Erro ao carregar pedidos.'
      });

    }

  }
);


/* CRIAR PEDIDO */

app.post(
  '/api/orders',
  (req, res) => {

    try {

      const {
        name,
        items
      } = req.body || {};


      if (!name) {

        return res.status(400).json({
          error:
            'Digite seu nome.'
        });

      }


      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {

        return res.status(400).json({
          error:
            'Carrinho vazio.'
        });

      }


      const data = db();

      const cleanItems = [];

      let total = 0;


      for (const item of items) {

        const product =
          data.products.find(
            product =>
              product.id ===
              Number(item.id)
          );


        const quantity =
          Math.max(
            0,
            Math.floor(
              Number(item.qty) || 0
            )
          );


        if (
          !product ||
          quantity < 1
        ) {

          return res.status(400).json({
            error:
              'Produto inválido.'
          });

        }


        if (
          quantity > product.stock
        ) {

          return res.status(400).json({
            error:
              `Estoque insuficiente: ${product.name}`
          });

        }


        cleanItems.push({

          productId:
            product.id,

          name:
            product.name,

          price:
            product.price,

          qty:
            quantity

        });


        total +=
          product.price *
          quantity;

      }


      cleanItems.forEach(
        item => {

          const product =
            data.products.find(
              product =>
                product.id ===
                item.productId
            );

          product.stock -=
            item.qty;

        }
      );


      const order = {

        id: Date.now(),

        userId: null,

        userName:
          String(name),

        items:
          cleanItems,

        total,

        status:
          'aguardando_pagamento',

        createdAt:
          new Date().toISOString()

      };


      data.orders.push(
        order
      );


      save(data);


      res.json(
        order
      );


    } catch (error) {

      console.error(
        'ERRO AO CRIAR PEDIDO:',
        error
      );


      res.status(500).json({

        error:
          'Erro ao salvar o pedido no servidor.'

      });

    }

  }
);


/* EDITAR PRODUTO */

app.put(
  '/api/products/:id',
  auth,
  admin,
  (req, res) => {

    try {

      const data = db();


      const product =
        data.products.find(
          product =>
            product.id ===
            Number(
              req.params.id
            )
        );


      if (!product) {

        return res.status(404).json({
          error:
            'Produto não encontrado'
        });

      }


      if (req.body.name) {

        product.name =
          String(
            req.body.name
          );

      }


      if (
        req.body.price != null
      ) {

        product.price =
          Number(
            req.body.price
          );

      }


      if (
        req.body.stock != null
      ) {

        product.stock =
