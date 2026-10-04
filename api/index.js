module.exports = (req, res) => {
  res.status(200).json({
    funcionando: true,
    url: req.url,
    caminho: req.path
  });
};
