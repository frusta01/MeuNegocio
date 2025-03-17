import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://lfufuqtyypcioymmctxe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmdWZ1cXR5eXBjaW95bW1jdHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjM0NjUsImV4cCI6MjA1Nzc5OTQ2NX0.y3vcx2x1s46UVmacWQY7yb8A1zdbmGPxJn_yiAQl1KE";
const supabase = createClient(supabaseUrl, supabaseKey);

let paginaAtual = 1;
const registrosPorPagina = 10;

async function gerarRelatorio() {
    const dataInicial = document.getElementById("data-inicial").value;
    const dataFinal = document.getElementById("data-final").value;
    
    if (!dataInicial || !dataFinal) {
        alert("Por favor, selecione um intervalo de datas.");
        return;
    }

    // Buscar vendas no intervalo de datas
    const { data, error } = await supabase
        .from('vendas')
        .select('produto_id, quantidade, preco_unitario, desconto, total_venda, data_venda')
        .gte('data_venda', dataInicial)
        .lte('data_venda', dataFinal);

    if (error) {
        console.error("Erro ao buscar vendas:", error);
        return;
    }

    // Exibindo as vendas
    carregarTabelaVendas(data);
    calcularResumo(data);
    gerarGrafico(data);
    atualizarPaginaAtual();
}

async function getProdutos() {
    const { data, error } = await supabase
        .from('estoque')  // Supondo que a tabela seja 'produtos'
        .select('id, nome_produto');

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        return [];
    }

    return data;  // Retorna todos os produtos
}

async function getVendas() {
    // Recupera todas as vendas
    const { data, error } = await supabase
        .from('vendas')
        .select('produto_id, quantidade, preco_unitario, desconto, total_venda, data_venda');

    if (error) {
        console.error('Erro ao buscar vendas:', error);
        return [];
    }

    return data;
}

function carregarTabelaVendas(vendas) {
    const tbody = document.querySelector("#tabela-vendas tbody");
    tbody.innerHTML = "";

    const vendasPaginaAtual = vendas.slice((paginaAtual - 1) * registrosPorPagina, paginaAtual * registrosPorPagina);

    vendasPaginaAtual.forEach(async venda => {
        const tr = document.createElement("tr");

        const produtoId = venda.produto_id;
        const produtoNome = await getNomeProduto(produtoId);  // Busca nome do produto de forma assíncrona

        tr.innerHTML = `
            <td>${produtoNome}</td>
            <td>${venda.quantidade}</td>
            <td>${venda.preco_unitario}</td>
            <td>${venda.desconto}</td>
            <td>${venda.total_venda}</td>
            <td>${venda.data_venda}</td>
        `;

        tbody.appendChild(tr);
    });
}

async function getNomeProduto(produto_id) {
    // Busca o nome do produto baseado no id
    const produtos = await getProdutos();
    const produto = produtos.find(p => p.id === produto_id);
    return produto ? produto.nome_produto : "Produto Não Encontrado";
}

function calcularResumo(vendas) {
    let totalVendas = 0;
    let totalDescontos = 0;
    let totalValor = 0;

    vendas.forEach(venda => {
        totalVendas += venda.quantidade * venda.preco_unitario;
        totalDescontos += venda.desconto;
        totalValor += venda.total_venda;
    });

    document.getElementById("total-vendas").textContent = totalVendas.toFixed(2);
    document.getElementById("total-descontos").textContent = totalDescontos.toFixed(2);
    document.getElementById("total-valor").textContent = totalValor.toFixed(2);
}

function gerarGrafico(vendas) {
    const ctx = document.getElementById("grafico-vendas").getContext("2d");

    // Agrupar vendas por data
    const vendasPorData = {};

    vendas.forEach(venda => {
        const dataVenda = venda.data_venda;
        if (!vendasPorData[dataVenda]) {
            vendasPorData[dataVenda] = 0;
        }
        vendasPorData[dataVenda] += venda.total_venda;
    });

    const labels = Object.keys(vendasPorData);
    const valores = Object.values(vendasPorData);

    const graficoVendas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total de Vendas (R$)',
                data: valores,
                backgroundColor: '#007bff',
                borderColor: '#0056b3',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function pesquisar() {
    const termoBusca = document.getElementById("pesquisa").value.toLowerCase();

    const produtos = await getProdutos();  // Recupera todos os produtos
    const vendas = await getVendas();  // Recupera todas as vendas

    // Filtra as vendas com base no nome do produto ou no valor da venda
    const vendasFiltradas = vendas.filter(venda => {
        const produto = produtos.find(produto => produto.id === venda.produto_id);
        const produtoNome = produto ? produto.nome_produto.toLowerCase() : "";
        
        return produtoNome.includes(termoBusca) || 
               venda.total_venda.toString().includes(termoBusca);
    });

    carregarTabelaVendas(vendasFiltradas);
}

function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        atualizarPaginaAtual();
    }
}

function proximaPagina() {
    paginaAtual++;
    atualizarPaginaAtual();
}

function atualizarPaginaAtual() {
    document.getElementById("pagina-atual").textContent = `Página ${paginaAtual}`;
    gerarRelatorio();  // Recarrega os dados ao mudar a página
}

// Event listeners para interagir com os botões
document.getElementById("gerarR").addEventListener('click', function(){
  gerarRelatorio();
})

document.getElementById("pesquisar").addEventListener('click', function(){
  pesquisar();
})

document.getElementById("pagina-anterior").addEventListener('click', function() {
    paginaAnterior();
});

document.getElementById("proxima-pagina").addEventListener('click', function() {
    proximaPagina();
});