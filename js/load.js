import { SUPABASE_URL, PUBLISHABLE_KEY } from "./ex_env.js";

const baseUrl = SUPABASE_URL.replace(/\/$/, "");
const cartaUrl = `${baseUrl}/rest/v1/carta`;

const form = document.getElementById("CardForm");
const mensagem = document.getElementById("mensagem");

const headers = {
    apikey: PUBLISHABLE_KEY,
    Authorization: `Bearer ${PUBLISHABLE_KEY}`
};

function mostrarMensagem(texto) {
    if (mensagem) mensagem.textContent = texto;
}

async function carregarJson(url, options = {}) {
    const response = await fetch(url, options);
    const texto = await response.text();

    let dados = null;
    try {
        dados = texto ? JSON.parse(texto) : null;
    } catch {
        dados = texto;
    }

    if (!response.ok) {
        const erro = typeof dados === "string" ? dados : dados?.message;
        throw new Error(erro || "Falha na requisição.");
    }

    return dados;
}

async function carregarOpcoes(selectId, tabela) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const url = new URL(`${baseUrl}/rest/v1/${tabela}`);
    url.searchParams.set("select", "codigo,nome");
    url.searchParams.set("order", "codigo.asc");

    const opcoes = await carregarJson(url, { headers });

    select.replaceChildren(new Option("Selecione...", ""));

    for (const opcao of opcoes) {
        select.add(new Option(opcao.nome, String(opcao.codigo)));
    }
}

function preencherFormulario(carta) {
    for (const campo of form.elements) {
        if (!campo.name || !(campo.name in carta)) continue;

        if (campo.type === "checkbox") {
            campo.checked = Boolean(carta[campo.name]);
        } else {
            campo.value = carta[campo.name] ?? "";
        }
    }
}

async function carregarCarta(codigo) {
    const url = new URL(cartaUrl);
    url.searchParams.set("select", "*");
    url.searchParams.set("codigo", `eq.${codigo}`);
    url.searchParams.set("limit", "1");

    const resultado = await carregarJson(url, { headers });

    if (!resultado.length) {
        throw new Error("Carta não encontrada ou sem permissão para acessá-la.");
    }

    preencherFormulario(resultado[0]);
}

function numeroOuNulo(id) {
    const valor = document.getElementById(id).value.trim();
    return valor === "" ? null : Number(valor);
}

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const codigo = document.getElementById("codigo").value;

    if (!codigo) {
        mostrarMensagem("Não foi encontrado o código da carta.");
        return;
    }

    const dadosAtualizados = {
        nome: document.getElementById("nome").value.trim(),
        // Os selects guardam os códigos das tabelas tipo e raridade.
        tipo: document.getElementById("tipo").value,
        raridade: document.getElementById("raridade").value,
        arena: numeroOuNulo("arena"),
        elixir: numeroOuNulo("elixir"),
        evolucao: document.getElementById("evolucao").checked,
        ciclo: numeroOuNulo("ciclo"),
        heroi: document.getElementById("heroi").checked,
        hab: document.getElementById("hab").value.trim(),
        custo: numeroOuNulo("custo")
    };

    try {
        const url = new URL(cartaUrl);
        url.searchParams.set("codigo", `eq.${codigo}`);

        await carregarJson(url, {
            method: "PATCH",
            headers: {
                ...headers,
                "Content-Type": "application/json",
                Prefer: "return=representation"
            },
            body: JSON.stringify(dadosAtualizados)
        });

        mostrarMensagem("Carta atualizada com sucesso.");
    } catch (error) {
        mostrarMensagem(`Erro ao atualizar a carta: ${error.message}`);
    }
});

async function iniciar() {
    try {
        const params = new URLSearchParams(window.location.search);
        // Aceita tanto ?codigo=... quanto o antigo ?id=...
        const codigo = params.get("codigo");

        if (!codigo) {
            throw new Error("O código da carta não foi informado na URL.");
        }

        await Promise.all([
            carregarOpcoes("tipo", "tipo"),
            carregarOpcoes("raridade", "raridade")
        ]);

        await carregarCarta(codigo);
        mostrarMensagem("Edite os dados da carta e salve as alterações.");
    } catch (error) {
        mostrarMensagem(`Erro ao carregar a carta: ${error.message}`);
    }
}

iniciar();