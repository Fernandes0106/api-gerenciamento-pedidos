const service = require('../services/pedidoService');

exports.criar = (req, res, next) => { try { res.status(201).json(service.criar(req.body)); } catch (e) { next(e); } };
exports.listar = (req, res) => res.status(200).json(service.listar());
exports.buscar = (req, res, next) => { try { res.status(200).json(service.buscarPorId(req.params.id)); } catch (e) { next(e); } };
exports.atualizarStatus = (req, res, next) => {
  try { res.status(200).json(service.atualizarStatus(req.params.id, req.body && req.body.status)); } catch (e) { next(e); }
};
