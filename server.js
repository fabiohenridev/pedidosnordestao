const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
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
  tipo: { type: String, enum: ['A1', 'A2', 'F'], required: true },
  finalizadoEm: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'criadoEm', updatedAt: false }
});

const Pedido = mongoose.model('Pedido', PedidoSchema);

// WebSocket
io.on('connection', socket => {
  console.log('🟢 Cliente conectado');
  socket.on('disconnect', () => console.log('🔴 Cliente desconectado'));
});

// Rota inicial
app.get('/', (req, res) => res.send('API de pedidos funcionando!'));

// POST /pedidos — Cria um novo pedido e emite para WebSocket
app.post('/pedidos', async (req, res) => {
  try {
    const { numeroCompra, descricao, tipo } = req.body;
    if (!numeroCompra || !descricao || !tipo) {
      return res.status(400).json({ erro: 'Número da compra, descrição e tipo são obrigatórios' });
    }
    if (!['A1', 'A2', 'F'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo deve ser A1, A2 ou F' });
    }

    const novo = new Pedido({ numeroCompra, descricao, tipo });
    await novo.save();

    io.emit('novo-pedido', {
      _id: novo._id,
      numeroCompra: novo.numeroCompra,
      descricao: novo.descricao,
      tipo: novo.tipo,
      criadoEmMS: novo.criadoEm.getTime()
    });

    res.status(201).json(novo);
  } catch (err) {
    console.error('Erro no POST /pedidos:', err);
    res.status(500).json({ erro: 'Erro ao salvar pedido' });
  }
});

// GET /pedidos — Lista pedidos em andamento
app.get('/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find({ finalizadoEm: null }).sort({ criadoEm: -1 });
    const serverTimeMS = Date.now();
    res.json({ serverTimeMS, pedidos });
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ erro: 'Erro ao buscar pedidos' });
  }
});

// GET /pedidos/finalizados — Lista pedidos finalizados
app.get('/pedidos/finalizados', async (req, res) => {
  try {
    const pedidosFinalizados = await Pedido.find({ finalizadoEm: { $ne: null } }).sort({ finalizadoEm: -1 });
    res.json(pedidosFinalizados);
  } catch (err) {
    console.error('Erro ao buscar pedidos finalizados:', err);
    res.status(500).json({ erro: 'Erro ao buscar pedidos finalizados' });
  }
});

// PATCH /pedidos/:id/finalizar — Finaliza um pedido
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
    console.error('Erro ao finalizar pedido:', err);
    res.status(500).json({ erro: 'Erro ao finalizar pedido' });
  }
});

// Iniciar servidor
server.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});