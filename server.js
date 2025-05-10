const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com MongoDB Atlas
mongoose.connect('mongodb+srv://henri8274:1QCtcecpyFCS7oQF@cluster0.u63gt3d.mongodb.net/?retryWrites=true&w=majority')
  .then(() => console.log('✅ Conectado ao MongoDB Atlas com sucesso!'))
  .catch((err) => console.error('❌ Erro ao conectar ao MongoDB:', err));

// Schema e model
const PedidoSchema = new mongoose.Schema({
  descricao: String
});
const Pedido = mongoose.model('Pedido', PedidoSchema);

// Rota POST - Criar pedido
app.post('/pedidos', async (req, res) => {
  try {
    const novo = new Pedido({ descricao: req.body.descricao });
    await novo.save();
    res.status(201).json({
        mensagem: '✅ Pedido recebido e salvo com sucesso!',
        pedido: novo
      });
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar pedido' });
  }
});

// Rota GET - Listar pedidos
app.get('/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ _id: -1 });
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pedidos' });
  }
});

// Rota DELETE - Deletar pedido
app.delete('/pedidos/:id', async (req, res) => {
  try {
    await Pedido.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar pedido' });
  }
});

// Rota raiz
app.get('/', (req, res) => {
  res.send('API de pedidos funcionando!');
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
