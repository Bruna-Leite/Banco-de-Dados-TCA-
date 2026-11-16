import { SUPABASE_URL, PUBLISHABLE_KEY } from "./ex_env.js";
async function carregarOpcoes(selectId, nomeTabela) {
    const select = document.querySelector(`#${selectId}`);
    const cacheKey = `opcoes_${nomeTabela}`;

    select.replaceChildren(new Option("Carregando...", ""));

    try {
        let dados = JSON.parse(sessionStorage.getItem(cacheKey) || "null");

        if (!dados) {
            const url = new URL(
                `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${nomeTabela}`
            );

            url.searchParams.set("select", "codigo,nome");

            const response = await fetch(url, {
                headers: {
                    apikey: PUBLISHABLE_KEY,
                    Authorization: `Bearer ${PUBLISHABLE_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            dados = await response.json();
            sessionStorage.setItem(cacheKey, JSON.stringify(dados));
        }

        select.replaceChildren(new Option("Selecione...", ""));

        for (const item of dados) {
            select.add(new Option(item.nome, String(item.codigo)));
        }
    } catch (error) {
        select.replaceChildren(new Option("Erro ao carregar", ""));
        throw error;
    }
}

try {
    console.time("Carregar tipo e raridade");

    await Promise.all([
        carregarOpcoes("tipo", "tipo"),
        carregarOpcoes("raridade", "raridade")
    ]);

    console.timeEnd("Carregar tipo e raridade");
} catch (error) {
    document.querySelector("#mensagem").textContent =
        `Erro ao carregar as opções: ${error.message}`;
}
async function inserirTabela(rota, dados, retorno = "minimal") {
    const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${rota}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            apikey: PUBLISHABLE_KEY,
            Authorization: `Bearer ${PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: `return=${retorno}`
        },
        body: JSON.stringify(dados)
    });

    const texto = await response.text();

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${texto}`);
    }

    return texto ? JSON.parse(texto) : null;
}

const form = document.querySelector("#CardForm");
const mensagem = document.querySelector("#mensagem");

const evolucaoInput = document.querySelector("#evolucao");
const cicloInput = document.querySelector("#ciclo");
const heroiInput = document.querySelector("#heroi");
const habilidadeInput = document.querySelector("#hab");

function atualizarCamposCondicionais() {
    cicloInput.required = evolucaoInput.checked;
    habilidadeInput.required = heroiInput.checked;
}

evolucaoInput.addEventListener("change", atualizarCamposCondicionais);
heroiInput.addEventListener("change", atualizarCamposCondicionais);

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    atualizarCamposCondicionais();

    if (!form.reportValidity()) return;

    const botao = document.querySelector("#Criar");
    botao.disabled = true;
    mensagem.textContent = "Salvando...";

    let codigoCartaSalva = null;

    try {
        const dadosCarta = {
            nome: document.querySelector("#nome").value.trim(),
            tipo: Number(document.querySelector("#tipo").value),
            raridade: Number(document.querySelector("#raridade").value),
            arena: Number(document.querySelector("#arena").value),
            elixir: Number(document.querySelector("#elixir").value),
            evolucao: evolucaoInput.checked,
            heroi: heroiInput.checked
        };

        const resultado = await inserirTabela(
            "carta?select=codigo",
            dadosCarta,
            "representation"
        );

        codigoCartaSalva = resultado?.[0]?.codigo;

        if (!codigoCartaSalva) {
            throw new Error("A carta foi enviada, mas não recebi seu código.");
        }

        if (evolucaoInput.checked) {
            await inserirTabela("evolucao", {
                carta: codigoCartaSalva,
                ciclos: Number(cicloInput.value)
            });
        }

        if (heroiInput.checked) {
            const custo = document.querySelector("#custo").value;

            await inserirTabela("heroi", {
                carta: codigoCartaSalva,
                habilidade: habilidadeInput.value.trim(),
                custo_hab: custo === "" ? null : Number(custo)
            });
        }

        mensagem.textContent = "Carta salva com sucesso!";
        form.reset();
        atualizarCamposCondicionais();
    } catch (error) {
        console.error("Erro ao salvar:", error);

        mensagem.textContent = codigoCartaSalva
            ? `A carta foi criada, mas houve erro ao salvar os detalhes: ${error.message}`
            : `Não foi possível salvar a carta: ${error.message}`;
    } finally {
        botao.disabled = false;
    }
});
await carregarCartas(); // use aqui o nome da sua função que atualiza a lista
form.reset();