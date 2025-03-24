import express from "express";
import { addWarehouse } from "../controllers/warehouse-controllers/addWarehouse";
import { isAuthenticated } from "../middlewares/auth-middleware";
import { authorizeRoles } from "../middlewares/role-middleware";
import { getAllWarehouses } from "../controllers/warehouse-controllers/getAllWarehouses";
import { editWarehouse } from "../controllers/warehouse-controllers/editWarehouse";
import { getWarehouseById } from "../controllers/warehouse-controllers/getWarehouseById";

const router = express.Router();

// Route for creating warehouse
router.get("/", isAuthenticated, authorizeRoles(["Admin",]), getAllWarehouses);
router.get("/:warehouseId", isAuthenticated, authorizeRoles(["Admin"]), getWarehouseById);
router.post("/add", isAuthenticated, authorizeRoles(["Admin",]), addWarehouse);
router.put("/:warehouseId/edit", isAuthenticated, authorizeRoles(["Admin",]), editWarehouse);

export default router;
