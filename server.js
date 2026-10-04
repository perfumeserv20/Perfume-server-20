const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'troque-esta-chave-em-producao';

const DB = path.join(__dirname, 'data.json');

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
  JSON.parse(fs.readFileSync(DB));

const save = (data) =>
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
    const token = (req.headers.authorization || '')
      .replace('Bearer ', '');

    req.user = jwt.verify(token, SECRET);

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

app.post('/api/register', async (req, res) => {

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
        user.email === email.toLowerCase()
    )
  ) {
    return res.status(409).json({
      error: 'E-mail já cadastrado'
    });
  }

  const user = {
    id: Date.now(),
    name,
    email: email.toLowerCase(),
    hash: await bcrypt.hash(password, 10),
    role: 'user'
  };

  data.users.push(user);

  save(data);

  res.json({
    token: jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role
      },
      SECRET
    ),
    name: user.name
  });

});


/* LOGIN */

app.post('/api/login', async (req, res) => {

  const {
    email,
    password
  } = req.body || {};

  const data = db();

  const user = data.users.find(
    user =>
      user.email ===
      String(email || '').toLowerCase()
  );

  if (
    !user ||
    !(await bcrypt.compare(
      password || '',
      user.hash
    ))
  ) {
    return res.status(401).json({
      error: 'E-mail ou senha inválidos'
    });
  }

  res.json({
    token: jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role
      },
      SECRET
    ),
    name: user.name,
    role: user.role
  });

});


/* PRODUTOS */

app.get('/api/products', (req, res) => {

  res.json(
    db().products
  );

});


/* USUÁRIO LOGADO */

app.get('/api/me', auth, (req, res) => {

  res.json(req.user);

});


/* PEDIDOS */

app.get('/api/orders', auth, (req, res) => {

  const data = db();

  res.json(
    data.orders.filter(
      order =>
        req.user.role === 'admin' ||
        order.userId === req.user.id
    )
  );

});


/* CRIAR PEDIDO */

app.post('/api/orders', (req, res) => {

  const {
    name,
    phone,
    items
  } = req.body || {};

  if (!name || !phone) {
    return res.status(400).json({
      error: 'Nome e WhatsApp são obrigatórios'
    });
  }

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      error: 'Carrinho vazio'
    });
  }

  const data = db();

  const cleanItems = [];

  let total = 0;


  for (const item of items) {

    const product =
      data.products.find(
        product =>
          product.id === Number(item.id)
      );

    const quantity =
      Math.max(
        0,
        Math.floor(
          Number(item.qty) || 0
        )
      );


    if (!product || quantity < 1) {

      return res.status(400).json({
        error: 'Produto inválido'
      });

    }


    if (quantity > product.stock) {

      return res.status(400).json({
        error:
          `Estoque insuficiente: ${product.name}`
      });

    }


    cleanItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: quantity
    });


    total +=
      product.price * quantity;

  }


  if (cleanItems.length === 0) {

    return res.status(400).json({
      error: 'Carrinho vazio'
    });

  }


  /* DIMINUIR ESTOQUE */

  cleanItems.forEach(item => {

    const product =
      data.products.find(
        product =>
          product.id === item.productId
      );

    product.stock -= item.qty;

  });


  /* SALVAR PEDIDO */

  const order = {

    id: Date.now(),

    userId: null,

    userName: String(name),

    phone: String(phone),

    items: cleanItems,

    total,

    status: 'aguardando_pagamento',

    createdAt:
      new Date().toISOString()

  };


  data.orders.push(order);

  save(data);


  res.json(order);

});


/* EDITAR PRODUTO */

app.put(
  '/api/products/:id',
  auth,
  admin,
  (req, res) => {

    const data = db();

    const product =
      data.products.find(
        product =>
          product.id ===
          Number(req.params.id)
      );


    if (!product) {

      return res.status(404).json({
        error: 'Produto não encontrado'
      });

    }


    if (req.body.name) {
      product.name =
        String(req.body.name);
    }


    if (req.body.price != null) {
      product.price =
        Number(req.body.price);
    }


    if (req.body.stock != null) {
      product.stock =
        Math.max(
          0,
          Math.floor(
            Number(req.body.stock) || 0
          )
        );
    }


    save(data);

    res.json(product);

  }
);


/* CRIAR ADMIN */

app.post(
  '/api/admin/bootstrap',
  async (req, res) => {

    const {
      email,
      password
    } = req.body || {};

    const data = db();


    if (
      data.users.some(
        user =>
          user.role === 'admin'
      )
    ) {

      return res.status(409).json({
        error: 'Admin já existe'
      });

    }


    const user = {

      id: Date.now(),

      name: 'Administrador',

      email:
        email.toLowerCase(),

      hash:
        await bcrypt.hash(
          password,
          10
        ),

      role: 'admin'

    };


    data.users.push(user);

    save(data);


    res.json({
      ok: true
    });

  }
);


/* ALTERAR STATUS DO PEDIDO */

app.put(
  '/api/orders/:id/status',
  auth,
  admin,
  (req, res) => {

    const data = db();

    const order =
      data.orders.find(
        order =>
          order.id ===
          Number(req.params.id)
      );


    if (!order) {

      return res.status(404).json({
        error: 'Pedido não encontrado'
      });

    }


    order.status =
      String(
        req.body.status || ''
      );


    save(data);

    res.json(order);

  }
);


/* SERVIDOR */

app.listen(
  PORT,
  () =>
    console.log(
      `SERV 20 em http://localhost:${PORT}`
    )
);
