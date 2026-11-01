// Testes feitos por: Pablo Neris Santiago
// Foco: RF01 - Cadastro de pedido (POST /pedidos)
const request = require('supertest');
const app = require('../src/app');
const service = require('../src/services/pedidoService');

beforeEach(() => service.resetar());

describe('Pablo Neris Santiago - POST /pedidos', () => {
  test('cria pedido válido e retorna 201 com status "recebido"', async () => {
    const res = await request(app).post('/pedidos').send({
      cliente: 'Carlos Silva', tipo: 'entrega', valor: 350, prioridade: 'normal',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 1, cliente: 'Carlos Silva', tipo: 'entrega', valor: 350, prioridade: 'normal', status: 'recebido',
    });
  });

  test('retorna 400 quando o cliente contém apenas espaços', async () => {
    const res = await request(app).post('/pedidos').send({
      cliente: '    ', tipo: 'entrega', valor: 350, prioridade: 'normal',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  test('retorna 400 quando o valor é zero, negativo ou texto', async () => {
    for (const valor of [0, -10, '350']) {
      const res = await request(app).post('/pedidos').send({
        cliente: 'Carlos Silva', tipo: 'entrega', valor, prioridade: 'normal',
      });

      expect(res.status).toBe(400);
      expect(res.body.erro).toMatch(/valor/i);
    }
  });
});
