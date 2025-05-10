const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Conexão com MongoDB
mongoose.connect(
  'mongodb+srv://henri8274:1QCtcecpyFCS7oQF@cluster0.u63gt3d.mongodb.net/?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => console.log('✅ Conectado ao MongoDB Atlas com sucesso!'))
  .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// Schema com número da compra, timestamps personalizados e finalizadoEm
const PedidoSchema = new mongoose.Schema({
  numeroCompra: { type: String, required: true },
  descricao:     { type: String, required: true },
  finalizadoEm:  { type: Date,   default: null }
}, {
  timestamps: { createdAt: 'criadoEm', updatedAt: false }
});

const Pedido = mongoose.model('Pedido', PedidoSchema);

// POST /pedidos — cria novo pedido
app.post('/pedidos', async (req, res) => {
  try {
    const { numeroCompra, descricao } = req.body;
    const novo = new Pedido({ numeroCompra, descricao });
    await novo.save();
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar pedido' });
  }
});

// GET /pedidos — lista todos
app.get('/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ criadoEm: -1 });
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pedidos' });
  }
});

// PATCH /pedidos/:id/finalizar — seta finalizadoEm
app.patch('/pedidos/:id/finalizar', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { finalizadoEm: new Date() },
      { new: true }
    );
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao finalizar pedido' });
  }
});

// DELETE /pedidos/:id — deleta pedido
app.delete('/pedidos/:id', async (req, res) => {
  try {
    await Pedido.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar pedido' });
  }
});

// Rota raiz
app.get('/', (req, res) => res.send('API de pedidos funcionando!'));

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
