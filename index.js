// index.js
// index.js
import express from "express";
import cors from "cors";
import prisma from "./database.js";

const app = express();

// Configurações iniciais
app.use(cors()); // Permite que o frontend acesse o backend livremente
app.use(express.json());

const PORT = 3000;

// Rota de teste
app.get("/", (req, res) => {
  res.json({ status: "API do Cantinho está online e completa! 🚀" });
});

//  Listar todas as mesas (com o status atual de cada uma)
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

//  Listar todos os itens do cardápio
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

// Abrir uma nova comanda para uma mesa
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

//  Adicionar itens/pedidos a uma comanda existente
app.post("/comandas/:id/itens", async (req, res) => {
  const comandaId = parseInt(req.params.id);
  const { itemCardapioId, quantidade, observacao } = req.body;

  try {
    // Busca o item do cardápio para saber o preço
    const itemCardapio = await prisma.cardapio.findUnique({
      where: { id: itemCardapioId },
    });
    if (!itemCardapio) {
      return res
        .status(404)
        .json({ error: "Item do cardápio não encontrado!" });
    }

    // Registra o item na comanda
    const novoItem = await prisma.itemComanda.create({
      data: {
        comandaId,
        itemCardapioId,
        quantidade,
        observacao,
      },
    });

    // Calcula o valor extra a ser somado na comanda
    const valorAdicional = itemCardapio.preco * quantidade;

    // Atualiza o valor total da comanda
    await prisma.comanda.update({
      where: { id: comandaId },
      data: {
        valorTotal: {
          increment: valorAdicional,
        },
      },
    });

    res.json(novoItem);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Erro ao adicionar item à comanda",
        detalhes: error.message,
      });
  }
});

// Ver detalhes de uma comanda ativa de uma mesa (incluindo os itens pedidos)
app.get("/mesas/:id/comanda-ativa", async (req, res) => {
  const mesaId = parseInt(req.params.id);

  try {
    const comanda = await prisma.comanda.findFirst({
      where: { mesaId: mesaId, status: "aberta" },
      include: {
        itens: {
          include: { itemCardapio: true }, // Traz o nome e preço do prato junto
        },
      },
    });

    if (!comanda) {
      return res
        .status(404)
        .json({ message: "Nenhuma comanda ativa para esta mesa." });
    }

    res.json(comanda);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao buscar comanda ativa", detalhes: error.message });
  }
});

// Fechar a comanda de uma mesa
app.put("/comandas/:id/fechar", async (req, res) => {
  const comandaId = parseInt(req.params.id);

  try {
    // Busca a comanda para saber qual é a mesa dela
    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
    });
    if (!comanda) {
      return res.status(404).json({ error: "Comanda não encontrada!" });
    }

    // Altera o status da comanda para fechada
    await prisma.comanda.update({
      where: { id: comandaId },
      data: { status: "fechada" },
    });

    // Libera a mesa correspondente mudando para 'livre'
    await prisma.mesa.update({
      where: { id: comanda.mesaId },
      data: { status: "livre" },
    });

    res.json({ message: "Comanda fechada e mesa liberada com sucesso!" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao fechar comanda", detalhes: error.message });
  }
});

// Rota de Seed (Mantida para conveniência se precisar repopular)
app.get("/seed", async (req, res) => {
  try {
    const numerosMesas = [1, 2, 3, 4, 5, 6];
    for (const numero of numerosMesas) {
      await prisma.mesa.upsert({
        where: { numero },
        update: {},
        create: { numero, status: "livre" },
      });
    }

    const itensCardapio = [
      // Entradas
      { nome: "Casquinha de Caranguejo", preco: 22.0, categoria: "entrada" },
      { nome: "Pastel de Aratu", preco: 14.5, categoria: "entrada" },
      { nome: "Caldinho de Sururu", preco: 16.0, categoria: "entrada" },
      { nome: "Isca de Peixe Empanada", preco: 35.9, categoria: "entrada" },
      { nome: "Camarão ao Alho e Óleo", preco: 48.0, categoria: "entrada" },

      // Pratos Principais
      { nome: "Moqueca de Camarão", preco: 125.0, categoria: "prato" },
      {
        nome: "Peixe Frito Inteiro com Pirão",
        preco: 95.0,
        categoria: "prato",
      },
      { nome: "Bobó de Camarão", preco: 110.0, categoria: "prato" },
      { nome: "Ensopado de Caranguejo", preco: 75.0, categoria: "prato" },
      { nome: "Risoto de Frutos do Mar", preco: 89.9, categoria: "prato" },
      { nome: "Polvo Grelhado com Batatas", preco: 135.0, categoria: "prato" },
      {
        nome: "Lagosta na Manteiga de Ervas",
        preco: 160.0,
        categoria: "prato",
      },

      // Bebidas
      { nome: "Suco de Mangaba 500ml", preco: 12.0, categoria: "bebida" },
      { nome: "Suco de Cajá 500ml", preco: 12.0, categoria: "bebida" },
      { nome: "Água de Coco Natural", preco: 8.5, categoria: "bebida" },
      { nome: "Caipirinha de Limão", preco: 18.0, categoria: "bebida" },
      { nome: "Cerveja Long Neck", preco: 11.0, categoria: "bebida" },
      { nome: "Refrigerante Lata", preco: 6.5, categoria: "bebida" },

      // Sobremesas
      {
        nome: "Cocada de Forno com Sorvete",
        preco: 22.0,
        categoria: "sobremesa",
      },
      { nome: "Pudim de Leite", preco: 12.0, categoria: "sobremesa" },
    ];

    for (const item of itensCardapio) {
      const existe = await prisma.cardapio.findFirst({
        where: { nome: item.nome },
      });
      if (!existe) {
        await prisma.cardapio.create({ data: item });
      }
    }

    res.json({
      message: "Banco de dados populado com sucesso! Mesas e Cardápio prontos.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao popular o banco", detalhes: error.message });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`🚀 Servidor COMPLETO rodando em http://localhost:${PORT}`);
  console.log(`=========================================\n`);
});
