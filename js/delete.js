import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, PUBLISHABLE_KEY } from './ex_env.js';

const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
const conteudo = document.querySelector('#conteudo');

if (!conteudo) {
  console.error('Não encontrei o elemento #conteudo no HTML.');
} else {
  conteudo.innerHTML = `
    <label for="registro-id">ID do registro do jogo:</label>
    <input id="registro-id" type="text" placeholder="Digite o ID">
    <button id="deletar" type="button">Deletar</button>
    <p id="mensagem" role="status"></p>
  `;

  document.querySelector('#deletar').addEventListener('click', async () => {
    const id = document.querySelector('#registro-id').value.trim();
    const mensagem = document.querySelector('#mensagem');

    if (!id) {
      mensagem.textContent = 'Digite o ID do registro.';
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar o registro ${id}?`)) return;

    try {
      const { error } = await supabase
        .from('carta') // substitua pelo nome real da tabela
        .delete()
        .eq('codigo', id); // substitua se a coluna identificadora tiver outro nome

      if (error) throw error;

      mensagem.textContent = 'Solicitação de exclusão concluída.';
    } catch (error) {
      console.error(error);
      mensagem.textContent = `Erro: ${error.message}`;
    }
  });
}
document.querySelector('#deletar').addEventListener('click', async () => {
  const codigo = Number(document.querySelector('#registro-id').value.trim());
  const mensagem = document.querySelector('#mensagem');

  if (!Number.isInteger(codigo) || codigo <= 0) {
    mensagem.textContent = 'Digite um código numérico válido.';
    return;
  }

  if (!confirm(
    `Excluir a carta ${codigo} e TODOS os registros associados em evolução e herói? Essa ação não pode ser desfeita.`
  )) return;

  try {
    const { error: evolucaoError } = await supabase
      .from('evolucao')
      .delete()
      .eq('carta', codigo);

    if (evolucaoError) throw evolucaoError;

    const { error: heroiError } = await supabase
      .from('heroi')
      .delete()
      .eq('carta', codigo);

    if (heroiError) throw heroiError;

    const { error: cartaError } = await supabase
      .from('carta')
      .delete()
      .eq('codigo', codigo);

    if (cartaError) throw cartaError;

    mensagem.textContent = 'Carta e registros associados excluídos.';
  } catch (error) {
    console.error(error);
    mensagem.textContent = `Erro: ${error.message}`;
  }
});