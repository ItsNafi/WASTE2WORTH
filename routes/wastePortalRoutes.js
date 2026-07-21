const express               = require('express');
const WastePortalController = require('../controllers/wastePortalController');
const { verifyToken }       = require('../middleware/authMiddleware');
const { requireRole }       = require('../middleware/roleMiddleware');
const { uploadWastePhoto }  = require('../middleware/uploadMiddleware');


const driveRouter = express.Router();


driveRouter.post('/', verifyToken, requireRole('Volunteer', 'Admin'), WastePortalController.createDrive);

driveRouter.get('/',  verifyToken, WastePortalController.getDrives);


const wasteLogRouter = express.Router();


wasteLogRouter.post('/', verifyToken, requireRole('Volunteer'), uploadWastePhoto, WastePortalController.createWasteLog);

wasteLogRouter.get('/',  verifyToken, WastePortalController.getWasteLogs);


const wasteRequestRouter = express.Router();


wasteRequestRouter.post('/',    verifyToken, requireRole('Citizen'),            WastePortalController.createWasteRequest);

wasteRequestRouter.get('/my',   verifyToken, requireRole('Citizen'),            WastePortalController.getMyRequests);

wasteRequestRouter.get('/incoming', verifyToken, requireRole('Volunteer'),      WastePortalController.getIncomingRequests);

wasteRequestRouter.patch('/:id', verifyToken,                                   WastePortalController.updateWasteRequest);

module.exports = { driveRouter, wasteLogRouter, wasteRequestRouter };
