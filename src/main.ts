console.log("JS Finanças iniciado (TypeScript).");

// Tipos
type TipoTransacao = "receita" | "despesa";

interface Transacao {
  id: string;
  descricao: string;
  tipo: TipoTransacao;
  valor: number;      // negativo para despesa; positivo para receita
  createdAt: number;  // timestamp
}

// Util
const brl = (n: number): string =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Helper para pegar elementos do DOM já tipados
const qs = <T extends Element>(sel: string): T => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Elemento não encontrado: ${sel}`);
  return el;
};

// DOM
const form = qs<HTMLFormElement>("#form-transacao");
const inputDescricao = qs<HTMLInputElement>("#descricao");
const inputValor = qs<HTMLInputElement>("#valor");
const selectTipo = qs<HTMLSelectElement>("#tipo");
const lista = qs<HTMLUListElement>("#lista-transacoes");
const totalEntradas = qs<HTMLParagraphElement>("#total-entradas");
const totalSaidas = qs<HTMLParagraphElement>("#total-saidas");
const saldo = qs<HTMLParagraphElement>("#saldo");
const msgSaldo = qs<HTMLElement>("#mensagem-saldo");
const btnLimpar = qs<HTMLButtonElement>("#btn-limpar");
const vazio = qs<HTMLParagraphElement>("#vazio");

// Estado
const carregar = (): Transacao[] => {
  try {
    const raw = localStorage.getItem("transacoes");
    return raw ? (JSON.parse(raw) as Transacao[]) : [];
  } catch {
    return [];
  }
};

let transacoes: Transacao[] = carregar();

// Persistência
const salvar = () => {
  localStorage.setItem("transacoes", JSON.stringify(transacoes));
};

// Render
const atualizarLista = (): void => {
  lista.innerHTML = "";

  const ordenadas = [...transacoes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  let entradas = 0;
  let saidas = 0;

  ordenadas.forEach((t) => {
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
      transacoes = transacoes.filter(x => x.id !== t.id);
      salvar();
      atualizarLista();
    };

    direita.appendChild(valorSpan);
    direita.appendChild(btnRemover);

    li.appendChild(esquerda);
    li.appendChild(direita);

    lista.appendChild(li);

    // Totais (sua abordagem minimalista: saídas positivas)
    if (t.tipo === "receita") entradas += t.valor;
    else saidas -= t.valor;
  });

  vazio.style.display = ordenadas.length === 0 ? "block" : "none";

  totalEntradas.textContent = brl(entradas);
  totalSaidas.textContent = brl(saidas);
  const saldoTotal = entradas - saidas;
  saldo.textContent = brl(saldoTotal);

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
};

// Submit
form.addEventListener("submit", (event: SubmitEvent) => {
  event.preventDefault();

  const descricao = inputDescricao.value.trim();
  let valor = Number(inputValor.value);
  const tipo = selectTipo.value as TipoTransacao;

  if (!descricao || Number.isNaN(valor)) {
    alert("Preencha a descrição e um valor numérico válido.");
    return;
  }

  // Normalização mínima de sinal
  if (tipo === "despesa" && valor > 0) valor = -valor;
  if (tipo === "receita" && valor < 0) valor = Math.abs(valor);

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? (crypto.randomUUID as () => string)()
      : String(Date.now() + Math.random());

  const nova: Transacao = {
    id,
    descricao,
    tipo,
    valor,
    createdAt: Date.now(),
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
