module.exports = (req, res) => {
  if (req.method === "GET" && req.url === "/api/products") {
    return res.status(200).json([
      {
        id: 1,
        name: "50K DINHEIRO SERV 20",
        price: 15,
        stock: 10
      },
      {
        id: 2,
        name: "100K DINHEIRO SERV 20",
        price: 30,
        stock: 10
      },
      {
        id: 3,
        name: "200K DINHEIRO SERV 20",
        price: 60,
        stock: 10
      }
    ]);
  }

  res.status(404).json({
    error: "Rota não encontrada"
  });
};
