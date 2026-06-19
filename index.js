// index.js
import express from "express";
import cors from "cors";
import prisma from "./database.js";

const app = express();

// Configurações iniciais
app.use(cors()); // Permite que o frontend acesse o backend livremente
app.use(express.json());

const PORT = 3000;

// 1. Rota de teste
app.get("/", (req, res) => {
  res.json({ status: "API do Cantinho está online e completa! 🚀" });
});

// 2. Listar todas as mesas (com o status atual de cada uma)
app.get("/mesas", async (req, res) => {
  try {
    const mesas = await prisma.mesa.findMany({
      orderBy: { numero: "asc" },
    });
    res.json(mesas);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao buscar mesas", detalhes: error.message });
  }
});

// 3. Listar todos os itens do cardápio
app.get("/cardapio", async (req, res) => {
  try {
    const cardapio = await prisma.cardapio.findMany();
    res.json(cardapio);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao buscar cardápio", detalhes: error.message });
  }
});

// 4. Abrir uma nova comanda para uma mesa
app.post("/comandas", async (req, res) => {
  const { mesaId } = req.body;

  try {
    // Verifica se a mesa já não está ocupada
    const mesa = await prisma.mesa.findUnique({ where: { id: mesaId } });
    if (!mesa || mesa.status === "aberta") {
      return res
        .status(400)
        .json({ error: "Mesa inválida ou já está ocupada!" });
    }

    // Cria a comanda aberta
    const novaComanda = await prisma.comanda.create({
      data: {
        mesaId: mesaId,
        status: "aberta",
        valorTotal: 0.0,
      },
    });

    // Atualiza o status da mesa para 'aberta' (ocupada)
    await prisma.mesa.update({
      where: { id: mesaId },
      data: { status: "aberta" },
    });

    res.json(novaComanda);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao abrir comanda", detalhes: error.message });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`🚀 Servidor COMPLETO rodando em http://localhost:${PORT}`);
  console.log(`=========================================\n`);
});
