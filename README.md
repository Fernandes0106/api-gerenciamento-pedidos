# API de Gerenciamento de Pedidos

API REST para gerenciar os pedidos de uma pequena loja, feita em Node.js com Express, em arquitetura em camadas.

Projeto prático avaliativo de **Tópicos Avançados em Sistemas de Informação II**.

**Integrantes**

| Nome | Responsabilidade nos testes |
|---|---|
| Pablo Neris Santiago | RF01: cadastro de pedido (`POST /pedidos`) |
| Daniel Bandeira Baldini | RF02 e RF03: listagem e consulta (`GET /pedidos`, `GET /pedidos/:id`) |
| Danillo Fernandes Gomes | RF04: atualização de status (`PATCH /pedidos/:id/status`) |

---

## Tecnologias

- Node.js e Express (JavaScript)
- Jest e Supertest para os testes automatizados
- Postman para os testes manuais
- Armazenamento em memória: os dados se perdem quando a API é reiniciada

## Instalação e execução

Pré-requisito: Node.js 18 ou superior.

```bash
npm install
npm start
```

A API sobe em `http://localhost:3000`. Para usar outra porta, defina a variável `PORT`.

> **Windows / PowerShell:** se aparecer o erro *"a execução de scripts foi desabilitada neste sistema"*, use `npm.cmd start` e `npm.cmd test`, ou rode os comandos no Prompt de Comando (cmd).

## Rotas

| Método | Rota | Descrição | Respostas |
|---|---|---|---|
| POST | `/pedidos` | Cadastra um pedido | 201 criado · 400 dados inválidos |
| GET | `/pedidos` | Lista todos os pedidos | 200 |
| GET | `/pedidos/:id` | Consulta um pedido pelo id | 200 encontrado · 404 inexistente |
| PATCH | `/pedidos/:id/status` | Atualiza o status do pedido | 200 atualizado · 400 inválido · 404 inexistente |

### Valores aceitos

| Campo | Regra |
|---|---|
| `cliente` | Texto obrigatório, não vazio, mesmo depois de remover os espaços das pontas (o valor salvo fica sem esses espaços) |
| `valor` | Número maior que zero. Texto como `"350"` é recusado |
| `tipo` | `entrega` ou `retirada` |
| `prioridade` | `baixa`, `normal` ou `alta` |
| `status` | `recebido`, `em_preparacao`, `enviado`, `entregue` ou `cancelado` |

Todo pedido novo começa com status `recebido` e recebe um `id` numérico sequencial (1, 2, 3, ...).

### Regras de transição de status

```
recebido ──► em_preparacao ──► enviado ──► entregue
   │               │
   └──► cancelado ◄┘
```

| Status atual | Pode ir para |
|---|---|
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue` | (status final) |
| `cancelado` | (status final) |

Um status desconhecido, ou uma transição fora da tabela (por exemplo, de `recebido` direto para `entregue`), retorna **400**.

## Exemplos

**Criar pedido**

```http
POST /pedidos
Content-Type: application/json

{
  "cliente": "Carlos Silva",
  "tipo": "entrega",
  "valor": 350,
  "prioridade": "normal"
}
```

Resposta `201 Created`:

```json
{
  "id": 1,
  "cliente": "Carlos Silva",
  "tipo": "entrega",
  "valor": 350,
  "prioridade": "normal",
  "status": "recebido"
}
```

**Dados inválidos**: `POST /pedidos` com `"cliente": "   "` → `400 Bad Request`

```json
{ "erro": "Cliente é obrigatório." }
```

**Pedido inexistente**: `GET /pedidos/9999` → `404 Not Found`

```json
{ "erro": "Pedido não encontrado." }
```

**Atualizar status**

```http
PATCH /pedidos/1/status
Content-Type: application/json

{ "status": "em_preparacao" }
```

Resposta `200 OK`: o pedido completo, com `"status": "em_preparacao"`.

**Transição não permitida**: `PATCH /pedidos/1/status` com `{ "status": "entregue" }` em um pedido `recebido` → `400`

```json
{ "erro": "Transição de \"recebido\" para \"entregue\" não permitida." }
```

## Tratamento de erros

Todas as respostas de erro são JSON no formato `{ "erro": "mensagem" }`.

| Situação | Código |
|---|---|
| Dados inválidos ou transição não permitida | 400 |
| Corpo da requisição com JSON malformado | 400 (`"JSON inválido no corpo da requisição."`) |
| Id inexistente | 404 |
| Erro inesperado no servidor | 500 (`"Erro interno do servidor."`). O detalhe vai só para o log, não para o usuário |

Os erros esperados são classes próprias no service (`ValidationError` → 400, `NotFoundError` → 404). Qualquer outro erro cai no middleware de erro do `app.js` como 500, para não ser confundido com um erro de validação do usuário.

## Arquitetura

```
src/
├── server.js                      # sobe o servidor (app.listen)
├── app.js                         # configura o Express, as rotas e o middleware de erros
├── routes/pedidoRoutes.js         # liga cada método + URL ao controller
├── controllers/pedidoController.js# lê a requisição, chama o service e define o código HTTP
└── services/pedidoService.js      # regras de negócio, validações e armazenamento em memória
tests/                             # testes automatizados (Jest + Supertest)
evidencias/                        # prints do Postman e da execução dos testes
postman/                           # coleção do Postman com as requisições das evidências
```

**Padrão implementado:** arquitetura em camadas (Routes → Controllers → Services).

- **Routes:** só definem os caminhos. Não têm lógica.
- **Controllers:** traduzem HTTP ↔ aplicação: pegam `req.body` e `req.params`, chamam o service e respondem com o status correto. Erros são repassados com `next(erro)`.
- **Services:** concentram as regras (validações, transições de status, geração de id). Não sabem nada de HTTP, então podem ser reaproveitados e testados isoladamente.

O `app.js` fica separado do `server.js` para que os testes importem a aplicação sem abrir uma porta de rede.

## Testes

### Automatizados (Jest)

```bash
npm test
```

São 9 testes, 3 por integrante:

| Arquivo | Autor | O que testa |
|---|---|---|
| `tests/pablo.criacao.test.js` | Pablo Neris Santiago | POST válido → 201; cliente só com espaços → 400; valor 0, negativo ou texto → 400 |
| `tests/daniel.consulta.test.js` | Daniel Bandeira Baldini | Listagem → 200; consulta de id existente → 200; id inexistente → 404 |
| `tests/danillo.status.test.js` | Danillo Fernandes Gomes | Transição válida → 200; status desconhecido ou transição inválida → 400; id inexistente → 404 |

Antes de cada teste, o armazenamento em memória é limpo com `service.resetar()`, para que um teste não interfira no outro.

O documento `Testes_API_Pedidos.pdf` explica cada caso e traz os prints da execução no Prompt de Comando, que também estão em `evidencias/testes/`.

### Manuais (Postman)

Importe `postman/API_Pedidos.postman_collection.json` no Postman, rode a API com `npm start` e envie as requisições na ordem (01 a 05).

## Evidências

| Arquivo | Cenário |
|---|---|
| `evidencias/01-criacao.png` | POST válido com resposta 201 |
| `evidencias/02-validacao.png` | POST inválido com resposta 400 |
| `evidencias/03-listagem.png` | GET da lista de pedidos |
| `evidencias/04-consulta-inexistente.png` | GET de id inexistente com 404 |
| `evidencias/05-atualizacao.png` | PATCH de status válido |
| `evidencias/testes/*.png` | Execução dos testes Jest no Prompt de Comando, um print por integrante e um geral |

## Uso de IA

**Utilizamos IA?** Sim. Usamos o Claude (Anthropic), pelo Claude Code, como apoio.

**Para quais tarefas:**

- ler o enunciado e listar os requisitos que faltavam;
- gerar a primeira versão da API em camadas (routes, controllers, services);
- escrever os testes automatizados com Jest e Supertest;
- montar o PDF de testes, a coleção do Postman e este README;
- resolver o erro do PowerShell que impedia rodar o `npm test`.

Todo o código foi executado e conferido pelo grupo: os 9 testes automatizados passam, e os prints das evidências vêm da API rodando de verdade.

**Sugestão aceita:** separar o `app.js` (configuração do Express) do `server.js` (que chama `app.listen`) e criar a função `resetar()` no service.
*Justificativa:* com isso os testes importam a aplicação sem abrir uma porta e começam sempre com a lista de pedidos vazia. Assim, cada teste pode ser rodado sozinho e em qualquer ordem.

**Sugestão aceita no lugar de outra:** para o erro *"a execução de scripts foi desabilitada"* do PowerShell, a IA sugeriu rodar `npm.cmd test` ou usar o Prompt de Comando, em vez de alterar a política de execução do Windows (`Set-ExecutionPolicy`).
*Justificativa:* resolve o problema sem mexer em uma configuração de segurança do sistema.

**Sugestão modificada:** a primeira versão dos testes e do PDF trazia o nome de um integrante grafado errado ("Fernades"). Corrigimos para "Danillo Fernandes Gomes" e geramos tudo de novo.
*Justificativa:* a separação dos testes por autor precisa estar correta, porque é ela que mostra quem fez cada parte.
