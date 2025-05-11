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

// Schema
const PedidoSchema = new mongoose.Schema({
  numeroCompra: { type: String, required: true },
  descricao: { type: String, required: true },
  finalizadoEm: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'criadoEm', updatedAt: false }
});

const Pedido = mongoose.model('Pedido', PedidoSchema);

// POST /pedidos
app.post('/pedidos', async (req, res) => {
  try {
    const { numeroCompra, descricao } = req.body;

    if (!numeroCompra || !descricao) {
      return res.status(400).json({ erro: 'Número da compra e descrição são obrigatórios' });
    }

    const novo = new Pedido({ numeroCompra, descricao });
    await novo.save();
    res.status(201).json(novo);
  } catch (err) {
    console.error('Erro no POST /pedidos:', err);
    res.status(500).json({ erro: 'Erro ao salvar pedido' });
  }
});

// GET /pedidos/finalizados — só os finalizados hoje
app.get('/pedidos/finalizados', async (req, res) => {
  try {
    // Cria um Date para hoje às 00:00 no fuso local do servidor
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Busca só os finalizados hoje em diante
    const finalizadosHoje = await Pedido
      .find({ finalizadoEm: { $gte: hoje } })
      .sort({ finalizadoEm: -1 });

    res.json(finalizadosHoje);
  } catch (err) {
    console.error('Erro ao buscar pedidos finalizados de hoje:', err);
    res.status(500).json({ erro: 'Erro ao buscar pedidos finalizados de hoje' });
  }
});

  
  

// PATCH /pedidos/:id/finalizar
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

// DELETE /pedidos/:id
app.delete('/pedidos/:id', async (req, res) => {
  try {
    await Pedido.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar pedido' });
  }
});

// 🔴 NOVA ROTA: DELETE /pedidos/nao-finalizados
app.delete('/pedidos/nao-finalizados', async (req, res) => {
  try {
    const resultado = await Pedido.deleteMany({ finalizadoEm: null });
    res.json({
      mensagem: 'Pedidos não finalizados deletados com sucesso',
      deletados: resultado.deletedCount
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar pedidos não finalizados' });
  }
});

// GET /pedidos/finalizados
app.get('/pedidos/finalizados', async (req, res) => {
    try {
      const finalizados = await Pedido.find({ finalizadoEm: { $ne: null } }).sort({ finalizadoEm: -1 });
      res.json(finalizados);
    } catch (err) {
      res.status(500).json({ erro: 'Erro ao buscar pedidos finalizados' });
    }
  });
  

// Rota raiz
app.get('/', (req, res) => res.send('API de pedidos funcionando!'));

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
