const TIPOS = ['entrega', 'retirada'];
const PRIORIDADES = ['baixa', 'normal', 'alta'];
const TRANSICOES = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: [],
};

class ValidationError extends Error { constructor(m) { super(m); this.status = 400; } }
class NotFoundError extends Error { constructor(m) { super(m); this.status = 404; } }

let pedidos = [];
let proximoId = 1;

function criar({ cliente, tipo, valor, prioridade } = {}) {
  if (typeof cliente !== 'string' || cliente.trim() === '') throw new ValidationError('Cliente é obrigatório.');
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) throw new ValidationError('Valor deve ser numérico e maior que zero.');
  if (!TIPOS.includes(tipo)) throw new ValidationError(`Tipo inválido. Use: ${TIPOS.join(', ')}.`);
  if (!PRIORIDADES.includes(prioridade)) throw new ValidationError(`Prioridade inválida. Use: ${PRIORIDADES.join(', ')}.`);
  const pedido = { id: proximoId++, cliente: cliente.trim(), tipo, valor, prioridade, status: 'recebido' };
  pedidos.push(pedido);
  return pedido;
}

function listar() { return pedidos; }

function buscarPorId(id) {
  const pedido = pedidos.find((p) => p.id === Number(id));
  if (!pedido) throw new NotFoundError('Pedido não encontrado.');
  return pedido;
}

function atualizarStatus(id, status) {
  const pedido = buscarPorId(id);
  if (!Object.keys(TRANSICOES).includes(status)) throw new ValidationError('Status inválido.');
  if (!TRANSICOES[pedido.status].includes(status)) throw new ValidationError(`Transição de "${pedido.status}" para "${status}" não permitida.`);
  pedido.status = status;
  return pedido;
}

function resetar() { pedidos = []; proximoId = 1; }

module.exports = { criar, listar, buscarPorId, atualizarStatus, resetar };
