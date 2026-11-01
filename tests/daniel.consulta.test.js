// Testes feitos por: Daniel Bandeira Baldini
// Foco: RF02 e RF03 - Listagem e consulta (GET /pedidos e GET /pedidos/:id)
const request = require('supertest');
const app = require('../src/app');
const service = require('../src/services/pedidoService');

const pedidoValido = { cliente: 'Ana Souza', tipo: 'retirada', valor: 120.5, prioridade: 'alta' };

beforeEach(() => service.resetar());

describe('Daniel Bandeira Baldini - GET /pedidos', () => {
  test('lista os pedidos cadastrados e retorna 200', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    await request(app).post('/pedidos').send({ ...pedidoValido, cliente: 'Bruno Lima' });

    const res = await request(app).get('/pedidos');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((p) => p.cliente)).toEqual(['Ana Souza', 'Bruno Lima']);
  });

  test('consulta pedido existente pelo id e retorna 200', async () => {
    const criado = await request(app).post('/pedidos').send(pedidoValido);

    const res = await request(app).get(`/pedidos/${criado.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(criado.body);
  });

  test('retorna 404 ao consultar id inexistente', async () => {
    const res = await request(app).get('/pedidos/9999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('erro');
  });
});
