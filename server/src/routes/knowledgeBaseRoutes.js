const express = require('express');
const router = express.Router();
const knowledgeBaseController = require('../controllers/knowledgeBaseController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

router.use(authenticate);

router.get('/', checkPermission('knowledge_base', 'view'), knowledgeBaseController.getKnowledgeEntries);
router.get('/:id', checkPermission('knowledge_base', 'view'), knowledgeBaseController.getKnowledgeEntryById);
router.post('/', checkPermission('knowledge_base', 'create'), knowledgeBaseController.createKnowledgeEntry);
router.put('/:id', checkPermission('knowledge_base', 'update'), knowledgeBaseController.updateKnowledgeEntry);
router.delete('/:id', checkPermission('knowledge_base', 'delete'), knowledgeBaseController.deleteKnowledgeEntry);
router.post('/import/course/:courseId', checkPermission('knowledge_base', 'create'), knowledgeBaseController.importFromCourse);

module.exports = router;
