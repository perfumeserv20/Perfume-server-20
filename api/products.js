module.exports = (req, res) => {
  res.status(200).json([
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
};
