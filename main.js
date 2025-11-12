console.log("JS Finanças iniciado.");

// Util
const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// DOM
const form = document.getElementById("form-transacao");
const inputDescricao = document.getElementById("descricao");
const inputValor = document.getElementById("valor");
const selectTipo = document.getElementById("tipo");
const lista = document.getElementById("lista-transacoes");
const totalEntradas = document.getElementById("total-entradas");
const totalSaidas = document.getElementById("total-saidas");
const saldo = document.getElementById("saldo");
const msgSaldo = document.getElementById("mensagem-saldo");
const btnLimpar = document.getElementById("btn-limpar");
const vazio = document.getElementById("vazio");

// Estado
let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];

// Persistência
function salvar() {
  localStorage.setItem("transacoes", JSON.stringify(transacoes));
}

// Render
function atualizarLista() {
  lista.innerHTML = "";

  // ordenar por mais recente
  const ordenadas = [...transacoes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  let entradas = 0;
  let saidas = 0;

  ordenadas.forEach((t, index) => {
    const li = document.createElement("li");

    const esquerda = document.createElement("div");
    esquerda.style.display = "flex";
    esquerda.style.alignItems = "center";
    esquerda.style.gap = "8px";

    const desc = document.createElement("span");
    desc.textContent = t.descricao;

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = t.tipo;

    esquerda.appendChild(desc);
    esquerda.appendChild(tag);

    const direita = document.createElement("div");
    direita.style.display = "flex";
    direita.style.alignItems = "center";
    direita.style.gap = "8px";

    const valorSpan = document.createElement("span");
    valorSpan.className = "valor";
    valorSpan.textContent = brl(t.valor);
    if (t.tipo === "despesa") valorSpan.style.color = "#dc2626";
    if (t.tipo === "receita") valorSpan.style.color = "#16a34a";

    const btnRemover = document.createElement("button");
    btnRemover.textContent = "❌";
    btnRemover.title = "Remover";
    btnRemover.onclick = () => {
      // Remove do estado original pelo id único
      const idxReal = transacoes.findIndex(x => x.id === t.id);
      if (idxReal >= 0) {
        transacoes.splice(idxReal, 1);
        salvar();
        atualizarLista();
      }
    };

    direita.appendChild(valorSpan);
    direita.appendChild(btnRemover);

    li.appendChild(esquerda);
    li.appendChild(direita);

    lista.appendChild(li);

    // Totais (sua abordagem minimalista)
    if (t.tipo === "receita") entradas += t.valor;
    else saidas += t.valor; // transforma despesa em positivo
  });

  // Estado vazio
  vazio.style.display = ordenadas.length === 0 ? "block" : "none";

  // Atualiza totais
  totalEntradas.textContent = brl(entradas);
  totalSaidas.textContent = brl(saidas);
  const saldoTotal = entradas + saidas;
  saldo.textContent = brl(saldoTotal);

  // Cor do saldo e mensagem dinâmica
  saldo.classList.remove("verde", "vermelho", "neutro");
  if (saldoTotal > 0) {
    saldo.classList.add("verde");
    msgSaldo.textContent = "Parabéns, você está no azul!";
  } else if (saldoTotal < 0) {
    saldo.classList.add("vermelho");
    msgSaldo.textContent = "Atenção: saldo negativo. Reveja despesas.";
  } else {
    saldo.classList.add("neutro");
    msgSaldo.textContent = "Saldo zerado. Vamos registrar as próximas transações.";
  }
}

// Submit
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const descricao = inputDescricao.value.trim();
  let valor = Number(inputValor.value);
  const tipo = selectTipo.value;

  if (!descricao || isNaN(valor)) {
    alert("Preencha a descrição e um valor numérico válido.");
    return;
  }

  // Normaliza mínimo (sem mexer no restante da lógica)
  if (tipo === "despesa" && valor > 0) valor = -valor;
  if (tipo === "receita" && valor < 0) valor = Math.abs(valor);

  const nova = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    descricao,
    tipo,
    valor,
    createdAt: Date.now()
  };

  transacoes.push(nova);
  salvar();
  atualizarLista();

  form.reset();
  inputDescricao.focus();
});

// Limpar tudo
btnLimpar.addEventListener("click", () => {
  if (confirm("Tem certeza que deseja apagar todas as transações?")) {
    transacoes = [];
    salvar();
    atualizarLista();
  }
});

// Inicialização
atualizarLista();
