const express = require('express');

const workbookController = require('../controllers/workbook.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);
router.get('/', workbookController.listWorkbooks);
router.put('/:id', workbookController.upsertWorkbook);
router.delete('/:id', workbookController.deleteWorkbook);

module.exports = router;
