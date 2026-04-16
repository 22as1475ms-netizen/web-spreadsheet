const workbookService = require('../services/workbook.service');

async function listWorkbooks(req, res, next) {
  try {
    const workbooks = await workbookService.listWorkbooks(req.user.id);
    res.json(workbooks);
  } catch (error) {
    next(error);
  }
}

async function upsertWorkbook(req, res, next) {
  try {
    const workbook = await workbookService.upsertWorkbook(req.user.id, req.params.id, req.body);
    res.json(workbook);
  } catch (error) {
    next(error);
  }
}

async function deleteWorkbook(req, res, next) {
  try {
    await workbookService.deleteWorkbook(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  deleteWorkbook,
  listWorkbooks,
  upsertWorkbook
};
