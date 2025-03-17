import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://lfufuqtyypcioymmctxe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmdWZ1cXR5eXBjaW95bW1jdHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjM0NjUsImV4cCI6MjA1Nzc5OTQ2NX0.y3vcx2x1s46UVmacWQY7yb8A1zdbmGPxJn_yiAQl1KE"; // ⚠️ NÃO EXIBA SUA CHAVE PÚBLICA ⚠️
const supabase = createClient(supabaseUrl, supabaseKey);

// Referências aos elementos do HTML
const productName = document.getElementById('product-name');
const productCategory = document.getElementById('product-category');
const productPrice = document.getElementById('product-price');
const productQuantity = document.getElementById('product-quantity');
const productSupplier = document.getElementById('product-supplier');
const addProductButton = document.getElementById('add-product');
const productListBody = document.getElementById('product-list-body');

// Função para carregar os produtos no estoque e preencher a tabela
async function carregarProdutos() {
  const { data, error } = await supabase
    .from("estoque")
    .select("*");

  if (error) {
    console.error("Erro ao carregar os produtos:", error);
  } else {
    const tbody = document.getElementById("product-list-body");
    tbody.innerHTML = ""; // Limpa a tabela antes de adicionar os produtos

    // Preenche a tabela com os produtos
    data.forEach(produto => {
      const tr = document.createElement("tr");

      // Cria as células da linha
      const nomeProduto = document.createElement("td");
      nomeProduto.textContent = produto.nome_produto; // Corrigido aqui

      const categoriaProduto = document.createElement("td");
      categoriaProduto.textContent = produto.categoria_produto;

      const precoProduto = document.createElement("td");
      precoProduto.textContent = `R$ ${produto.preco_produto.toFixed(2)}`;

      const quantidadeProduto = document.createElement("td");
      quantidadeProduto.textContent = produto.quantidade_produto;

      // Cria o botão de excluir
      const acoesProduto = document.createElement("td");
      const excluirButton = document.createElement("button");
      excluirButton.textContent = "Excluir";
      excluirButton.onclick = () => excluirProduto(produto.id); // Chama a função de excluir produto com o id

      acoesProduto.appendChild(excluirButton);

      // Adiciona as células à linha da tabela
      tr.appendChild(nomeProduto);
      tr.appendChild(categoriaProduto);
      tr.appendChild(precoProduto);
      tr.appendChild(quantidadeProduto);
      tr.appendChild(acoesProduto);

      // Adiciona a linha na tabela
      tbody.appendChild(tr);
    });
  }
}

// Função para excluir um produto
async function excluirProduto(produtoId) {
  const confirmacao = confirm("Você tem certeza que deseja excluir este produto?");
  if (confirmacao) {
    const { error } = await supabase
      .from("estoque")
      .delete()
      .eq("id", produtoId);

    if (error) {
      console.error("Erro ao excluir o produto:", error);
    } else {
      alert("Produto excluído com sucesso!");
      carregarProdutos(); // Recarrega os produtos para atualizar a tabela
    }
  }
}

// Função para adicionar um produto no estoque
async function adicionarProduto() {
  // Pegando os valores dos campos do formulário
  const nomeProduto = document.getElementById("produtoNome").value;
  const quantidadeProduto = document.getElementById("produtoQuantidade").value;
  const precoProduto = document.getElementById("produtoPreco").value;
  const categoriaProduto = document.getElementById("produtoCategoria").value;

  // Verificando se os campos obrigatórios estão preenchidos
  if (!nomeProduto || !quantidadeProduto || !precoProduto || !categoriaProduto) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  // Inserindo o produto no banco de dados
  const { data, error } = await supabase
    .from("estoque")  // Tabela no Supabase
    .insert([
      {
        nome_produto: nomeProduto,  // Corrigido aqui
        quantidade_produto: quantidadeProduto,
        preco_produto: precoProduto,
        categoria_produto: categoriaProduto,
      }
    ]);

  // Verificando se ocorreu algum erro ao adicionar
  if (error) {
    console.error("Erro ao adicionar o produto:", error);
    alert("Ocorreu um erro ao adicionar o produto.");
  } else {
    console.log("Produto adicionado com sucesso:", data);
    alert("Produto adicionado ao estoque com sucesso!");
    
    // Limpando os campos do formulário após adicionar
    document.getElementById("produtoNome").value = "";
    document.getElementById("produtoQuantidade").value = "";
    document.getElementById("produtoPreco").value = "";
    document.getElementById("produtoCategoria").value = "utensilios"; // Resetando para categoria padrão
  }
}

// Event listener para o formulário de adição de produto
document.getElementById("cadastrar").addEventListener('click', function(event) {
  event.preventDefault();  // Impede o envio do formulário
  adicionarProduto();      // Chama a função para adicionar o produto
});

// Função para alternar a visibilidade das opções do FAB
function toggleMenu() {
  document.querySelector(".fab-container").classList.toggle("active");
}

// Função para abrir o modal de cadastro de produto
function abrirCadastroProduto() {
  document.getElementById("cadastro-produto-modal").style.display = "block";
  document.getElementById("cadastro-produto-modal").style.display = "flex";
  document.getElementById("adicionar-produto-modal").style.display = "none";
}

// Função para abrir o modal de adicionar produto
async function abrirAdicionarProduto() {
  // Carregar os produtos no select
  const { data, error } = await supabase
    .from("estoque")
    .select("id, nome_produto");  // Corrigido aqui

  if (error) {
    console.error("Erro ao carregar os produtos:", error);
  } else {
    const select = document.getElementById("produto-select");
    select.innerHTML = ""; // Limpa o select
    data.forEach(produto => {
      const option = document.createElement("option");
      option.value = produto.id;
      option.textContent = produto.nome_produto;  // Corrigido aqui
      select.appendChild(option);
    });
document.getElementById("adicionar-produto-modal").style.display = "block";
document.getElementById("adicionar-produto-modal").style.display = "flex";

    
    document.getElementById("cadastro-produto-modal").style.display = "none";
  }
}

// Função para adicionar quantidade a um produto existente
async function adicionarQuantidade() {
  const produtoId = document.getElementById("produto-select").value;
  const quantidadeAdicionar = parseInt(document.getElementById("quantidade-adicionar").value);

  // Primeiro, busque a quantidade atual do produto
  const { data: produto, error: selectError } = await supabase
    .from("estoque")
    .select("quantidade_produto")
    .eq("id", produtoId)
    .single(); // Obtemos apenas um produto, já que o id é único

  if (selectError) {
    console.error("Erro ao buscar produto:", selectError);
    return;
  }

  // Calcule a nova quantidade
  const novaQuantidade = produto.quantidade_produto + quantidadeAdicionar;

  // Agora, atualize a quantidade do produto
  const { error } = await supabase
    .from("estoque")
    .update({ quantidade_produto: novaQuantidade })
    .eq("id", produtoId);

  if (error) {
    console.error("Erro ao adicionar quantidade:", error);
  } else {
    alert("Quantidade adicionada com sucesso!");
    carregarProdutos(); // Atualiza a tabela
    fecharModal("adicionar-produto-modal");
  }
}
// Event listeners para os botões
document.getElementById("addQ").addEventListener('click', function (){
  adicionarQuantidade();
});

document.getElementById("abcp").addEventListener('click', function (){
  abrirCadastroProduto();
});

document.getElementById("abap").addEventListener('click', function (){
  abrirAdicionarProduto();
});

document.getElementById("fecharmaddp").addEventListener('click', function (){
  document.getElementById("adicionar-produto-modal").style.display = "none";
});

document.getElementById("fecharmdcp").addEventListener('click', function (){
  document.getElementById('cadastro-produto-modal').style.display = "none";
});

// Carregar os produtos na inicialização
carregarProdutos();