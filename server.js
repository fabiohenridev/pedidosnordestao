const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app); // Criando servidor HTTP separado
const io = new Server(server, {
  cors: { origin: '*' }
});
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB
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

// WebSocket
io.on('connection', socket => {
  console.log('🟢 Cliente conectado');
  socket.on('disconnect', () => console.log('🔴 Cliente desconectado'));
});

// POST /pedidos — emite notificação ao vivo
app.post('/pedidos', async (req, res) => {
  try {
    const { numeroCompra, descricao } = req.body;
    if (!numeroCompra || !descricao) {
      return res.status(400).json({ erro: 'Número da compra e descrição são obrigatórios' });
    }
    const novo = new Pedido({ numeroCompra, descricao });
    await novo.save();
    io.emit('novo-pedido', {
      _id: novo._id,
      numeroCompra: novo.numeroCompra,
      descricao: novo.descricao,
      criadoEmMS: novo.criadoEm.getTime()
    });
    res.status(201).json(novo);
  } catch (err) {
    console.error('Erro no POST /pedidos:', err);
    res.status(500).json({ erro: 'Erro ao salvar pedido' });
  }
});

// (demais rotas mantidas como estão...)

app.get('/', (req, res) => res.send('API de pedidos funcionando!'));

// Usar server.listen em vez de app.listen
server.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
