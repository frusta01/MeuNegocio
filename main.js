import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://lfufuqtyypcioymmctxe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmdWZ1cXR5eXBjaW95bW1jdHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjM0NjUsImV4cCI6MjA1Nzc5OTQ2NX0.y3vcx2x1s46UVmacWQY7yb8A1zdbmGPxJn_yiAQl1KE"; // ⚠️ NÃO EXIBA SUA CHAVE PÚBLICA ⚠️
const supabase = createClient(supabaseUrl, supabaseKey);

async function carregarDashboard() {
    const vendas = await buscarVendas();
    const estoque = await buscarEstoque();

    preencherTabelaVendas(vendas);
    gerarGraficoVendas(vendas);
    gerarGraficoMaisVendidos(vendas);
    verificarEstoqueBaixo(estoque);
}

// Buscar vendas no Supabase
async function buscarVendas() {
    const { data, error } = await supabase
        .from('vendas')
        .select('produto_id, quantidade, total_venda, data_venda');

    if (error) {
        console.error("Erro ao buscar vendas:", error);
        return [];
    }
    return data;
}

// Buscar estoque no Supabase
async function buscarEstoque() {
    const { data, error } = await supabase
        .from('estoque')
        .select('id, nome_produto, quantidade_produto');

    if (error) {
        console.error("Erro ao buscar estoque:", error);
        return [];
    }
    return data;
}

// Preencher tabela de vendas
async function preencherTabelaVendas(vendas) {
    const estoque = await buscarEstoque();
    const tbody = document.querySelector("#tabela-vendas tbody");
    tbody.innerHTML = "";

    vendas.forEach(venda => {
        const produto = estoque.find(p => p.id === venda.produto_id);
        const produtoNome = produto ? produto.nome_produto : "Desconhecido";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${produtoNome}</td>
            <td>${venda.quantidade}</td>
            <td>R$ ${venda.total_venda.toFixed(2)}</td>
            <td>${new Date(venda.data_venda).toLocaleDateString()}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Gerar gráfico de vendas por data
function gerarGraficoVendas(vendas) {
    const ctx = document.getElementById("grafico-vendas").getContext("2d");

    const vendasPorData = vendas.reduce((acc, venda) => {
        const data = new Date(venda.data_venda).toLocaleDateString();
        acc[data] = (acc[data] || 0) + venda.total_venda;
        return acc;
    }, {});

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(vendasPorData),
            datasets: [{
                label: 'Total de Vendas (R$)',
                data: Object.values(vendasPorData),
                borderColor: 'blue',
                fill: false
            }]
        }
    });
}

// Gerar gráfico de produtos mais vendidos
function gerarGraficoMaisVendidos(vendas) {
    const ctx = document.getElementById("grafico-mais-vendidos").getContext("2d");

    const produtosVendidos = vendas.reduce((acc, venda) => {
        acc[venda.produto_id] = (acc[venda.produto_id] || 0) + venda.quantidade;
        return acc;
    }, {});

    buscarEstoque().then(estoque => {
        const labels = Object.keys(produtosVendidos).map(id => {
            const produto = estoque.find(p => p.id === parseInt(id));
            return produto ? produto.nome_produto : "Desconhecido";
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Quantidade Vendida',
                    data: Object.values(produtosVendidos),
                    backgroundColor: 'green'
                }]
            }
        });
    });
}

// Verificar e exibir alerta de estoque baixo
function verificarEstoqueBaixo(estoque) {
    const alertaDiv = document.getElementById("alerta-estoque");
    const produtosBaixos = estoque.filter(p => p.quantidade < 5);

    if (produtosBaixos.length > 0) {
        alertaDiv.style.display = "block";
        alertaDiv.innerHTML = "⚠️ Atenção! Os seguintes produtos estão com estoque baixo:<br>" +
            produtosBaixos.map(p => `${p.nome_produto} (${p.quantidade} unidades)`).join("<br>");
    } else {
        alertaDiv.style.display = "none";
    }
}

// Executa o carregamento do dashboard ao iniciar a página
carregarDashboard();