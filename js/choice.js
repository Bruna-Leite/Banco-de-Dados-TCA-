import {SUPABASE_URL, PUBLISHABLE_KEY} from "./ex_env.js";

const tabelasPermitidas = [
  "nivel_do_rei",
  "melhoria",
  "arena",
  "raridade",
  "tipo",
  "carta",
  "torre",
  "evolucao",
  "heroi"
];

const conteudo = document.getElementById("conteudo");
const tabelaSelect = document.getElementById("tabelaSelect");

let requisicaoAtual = 0;

tabelaSelect.addEventListener("change", () => {
  carregarTabela(tabelaSelect.value);
});

async function carregarTabela(nome) {
  const requisicao = ++requisicaoAtual;
  conteudo.replaceChildren();

  if (!nome) {
    conteudo.textContent = "Escolha uma tabela para consultar.";
    return;
  }

  // Aceita apenas nomes definidos no próprio código.
  if (!tabelasPermitidas.includes(nome)) {
    conteudo.textContent = "Tabela inválida.";
    return;
  }

  conteudo.textContent = "Carregando dados...";

  try {
    const resposta = await fetch(
      `${SUPABASE_URL}/rest/v1/${encodeURIComponent(nome)}?select=*`,
      {
        headers: {
          apikey: PUBLISHABLE_KEY,
          Authorization: `Bearer ${PUBLISHABLE_KEY}`
        }
      }
    );

    const dados = await resposta.json();

    // Evita exibir o resultado de uma seleção anterior.
    if (requisicao !== requisicaoAtual) return;

    if (!resposta.ok) {
      throw new Error(
        dados.message || dados.details || "Não foi possível carregar a tabela."
      );
    }

    conteudo.replaceChildren();

    const secao = document.createElement("section");
    secao.classList.add(nome);

    const titulo = document.createElement("h2");
    titulo.textContent = tabelaSelect.selectedOptions[0].textContent;
    secao.appendChild(titulo);

    if (dados.length === 0) {
      secao.append("Nenhum registro encontrado.");
      conteudo.appendChild(secao);
      return;
    }

    const colunas = Object.keys(dados[0]);
    const wrapper = document.createElement("div");
    wrapper.className = "scroll";

    const tabela = document.createElement("table");
    const thead = document.createElement("thead");
    const cabecalho = document.createElement("tr");

    for (const coluna of colunas) {
      const th = document.createElement("th");
      th.textContent = coluna;
      cabecalho.appendChild(th);
    }

    thead.appendChild(cabecalho);
    tabela.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (const registro of dados) {
      const linha = document.createElement("tr");

      for (const coluna of colunas) {
        const celula = document.createElement("td");
        const valor = registro[coluna];

        celula.textContent =
          valor === null
            ? ""
            : typeof valor === "object"
              ? JSON.stringify(valor)
              : String(valor);

        linha.appendChild(celula);
      }

      tbody.appendChild(linha);
    }

    tabela.appendChild(tbody);
    if (nome === "carta") {
        const acoes = document.createElement("div");
        acoes.className = "acoes-carta";
        const wish = document.createElement("p");
        wish.textContent="Gostaria de brincar com essa tabela? Clique um dos botões e experimenta.";
        acoes.appendChild(wish);
        acoes.appendChild(document.createElement("br"));
        const botoes = [
          ["Criar", "criar"],
          ["Deletar", "deletar"]
        ];
        const paginas = {
          criar: "criar.html",  
          deletar: "deletar.html"
        };
        for (const [texto, acao] of botoes) {
          const botao = document.createElement("button");
          botao.type = "button";
          botao.textContent = texto;
          botao.dataset.acao = acao;
          botao.id = `${acao}-carta`;
          botao.className = `botao-carta botao-${acao}`;
          botao.addEventListener("click", () =>{window.location.href = paginas[acao];});
          acoes.appendChild(botao);
        }
      
        acoes.addEventListener("click", (evento) => {
          const acao = evento.target.dataset.acao;
          if (!acao) return;
      
          if (acao === "criar") abrirFormularioCriacao();
          if (acao === "editar") abrirFormularioEdicao();
          if (acao === "deletar") deletarCartaSelecionada();
        });
      
        secao.appendChild(acoes);
      }
    wrapper.appendChild(tabela);
    secao.appendChild(wrapper);
    conteudo.appendChild(secao);
  } catch (erro) {
    if (requisicao !== requisicaoAtual) return;

    conteudo.textContent = `Erro ao carregar ${nome}: ${erro.message}`;
  }
}