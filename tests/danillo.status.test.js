// Testes feitos por: Danillo Fernandes Gomes
// Foco: RF04 - Atualização de status (PATCH /pedidos/:id/status)
const request = require('supertest');
const app = require('../src/app');
const service = require('../src/services/pedidoService');

let pedidoId;

beforeEach(async () => {
  service.resetar();
  const res = await request(app).post('/pedidos').send({
    cliente: 'Carlos Silva', tipo: 'entrega', valor: 350, prioridade: 'normal',
  });
  pedidoId = res.body.id;
});

describe('Danillo Fernandes Gomes - PATCH /pedidos/:id/status', () => {
  test('atualiza de "recebido" para "em_preparacao" e retorna 200', async () => {
    const res = await request(app).patch(`/pedidos/${pedidoId}/status`).send({ status: 'em_preparacao' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_preparacao');
  });

  test('retorna 400 para status desconhecido ou transição não permitida', async () => {
    const desconhecido = await request(app).patch(`/pedidos/${pedidoId}/status`).send({ status: 'voando' });
    expect(desconhecido.status).toBe(400);

    // "recebido" não pode ir direto para "entregue"
    const pulandoEtapa = await request(app).patch(`/pedidos/${pedidoId}/status`).send({ status: 'entregue' });
    expect(pulandoEtapa.status).toBe(400);
    expect(pulandoEtapa.body.erro).toMatch(/transição/i);
  });

  test('retorna 404 ao atualizar status de id inexistente', async () => {
    const res = await request(app).patch('/pedidos/9999/status').send({ status: 'cancelado' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('erro');
  });
});
