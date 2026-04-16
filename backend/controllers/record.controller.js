const recordService = require('../services/record.service');

async function listRecords(req, res, next) {
  try {
    const records = await recordService.listRecords(req.user.id);
    res.json(records);
  } catch (error) {
    next(error);
  }
}

async function createRecord(req, res, next) {
  try {
    const record = await recordService.createRecord(req.user.id, req.body);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

async function updateRecord(req, res, next) {
  try {
    const record = await recordService.updateRecord(
      req.user.id,
      req.params.id,
      req.body
    );
    res.json(record);
  } catch (error) {
    next(error);
  }
}

async function deleteRecord(req, res, next) {
  try {
    await recordService.deleteRecord(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord
};
