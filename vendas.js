import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://lfufuqtyypcioymmctxe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmdWZ1cXR5eXBjaW95bW1jdHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjM0NjUsImV4cCI6MjA1Nzc5OTQ2NX0.y3vcx2x1s46UVmacWQY7yb8A1zdbmGPxJn_yiAQl1KE"; // ⚠️ NÃO EXIBA SUA CHAVE PÚBLICA ⚠️
const supabase = createClient(supabaseUrl, supabaseKey);

// script.js

// Função para carregar os produtos no select
async function carregarProdutos() {
  const { data, error } = await supabase.from('estoque').select('*');

  if (error) {
    console.error('Erro ao carregar os produtos:', error);
    return;
  }

  const produtoSelect = document.getElementById('produto-select');
  produtoSelect.innerHTML = ''; // Limpa o select antes de preencher

  data.forEach(produto => {
    const option = document.createElement('option');
    option.value = produto.id;
    option.textContent = produto.nome_produto;
    produtoSelect.appendChild(option);
  });
}

// Função para registrar uma venda
async function registrarVenda(event) {
  event.preventDefault(); // Impede o envio do formulário

  const produtoId = document.getElementById('produto-select').value;
  const quantidade = parseInt(document.getElementById('quantidade-venda').value);
  const desconto = parseFloat(document.getElementById('desconto-venda').value);

  if (isNaN(quantidade) || quantidade <= 0) {
    alert('Quantidade inválida!');
    return;
  }

  // Buscar o produto no banco de dados
  const { data: produto, error: produtoError } = await supabase
    .from('estoque')
    .select('nome_produto, preco_produto, quantidade_produto')
    .eq('id', produtoId)
    .single();

  if (produtoError) {
    console.error('Erro ao buscar o produto:', produtoError);
    return;
  }

  const totalVenda = (produto.preco_produto * quantidade) - desconto;

  // Atualizar o estoque
  const { error: updateError } = await supabase
    .from('estoque')
    .update({ quantidade_produto: produto.quantidade_produto - quantidade })
    .eq('id', produtoId);

  if (updateError) {
    console.error('Erro ao atualizar o estoque:', updateError);
    return;
  }

  // Registrar a venda no banco de dados
  const { error: vendaError } = await supabase
    .from('vendas')
    .insert([
      {
        produto_id: produtoId,
        quantidade: quantidade,
        preco_unitario: produto.preco_produto,
        desconto: desconto,
        total_venda: totalVenda,
        data_venda: new Date().toISOString(),
      },
    ]);

  if (vendaError) {
    console.error('Erro ao registrar a venda:', vendaError);
    return;
  }

  // Atualizar o histórico de vendas
  adicionarVendaAoHistorico({
    produto: produto.nome_produto,
    quantidade,
    preco_unitario: produto.preco_produto,
    desconto,
    totalVenda
  });

  alert('Venda registrada com sucesso!');
  carregarProdutos(); // Atualiza a lista de produtos no select
}

// Adicionar uma venda à tabela de histórico
function adicionarVendaAoHistorico(venda) {
  const historicoVendas = document.getElementById('historico-vendas').getElementsByTagName('tbody')[0];
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>${venda.produto}</td>
    <td>${venda.quantidade}</td>
    <td>R$ ${venda.preco_unitario.toFixed(2)}</td>
    <td>R$ ${venda.desconto.toFixed(2)}</td>
    <td>R$ ${venda.totalVenda.toFixed(2)}</td>
    <td>${new Date().toLocaleString()}</td>
  `;

  historicoVendas.appendChild(tr);
}
// Função para carregar o histórico de vendas
async function carregarVendas() {
    const { data, error } = await supabase
        .from('vendas')
        .select(`
            id, 
            quantidade, 
            preco_unitario, 
            desconto, 
            total_venda, 
            data_venda, 
            estoque (nome_produto)
        `);

    if (error) {
        console.error('Erro ao carregar vendas:', error.message);
        return;
    }

    const historicoVendas = document.querySelector('#historico-vendas tbody');
    if (!historicoVendas) {
        console.error('Elemento #historico-vendas não encontrado');
        return;
    }

    historicoVendas.innerHTML = ''; // Limpa a tabela antes de preencher

    if (data.length === 0) {
        historicoVendas.innerHTML = '<tr><td colspan="6">Nenhuma venda registrada.</td></tr>';
        return;
    }

    data.forEach(venda => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${venda.estoque?.nome_produto || 'Produto não encontrado'}</td>
            <td>${venda.quantidade}</td>
            <td>R$ ${venda.preco_unitario.toFixed(2)}</td>
            <td>R$ ${venda.desconto.toFixed(2)}</td>
            <td>R$ ${venda.total_venda.toFixed(2)}</td>
            <td>${new Date(venda.data_venda).toLocaleString()}</td>
        `;
        historicoVendas.appendChild(tr);
    });
}

// Chamar a função ao carregar a página
document.addEventListener('DOMContentLoaded', carregarVendas);

// Evento para o formulário de vendas
document.getElementById('form-venda').addEventListener('submit', registrarVenda);

// Carregar os produtos quando a página for carregada
carregarProdutos();