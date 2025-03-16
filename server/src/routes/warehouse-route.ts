import express from "express";
import { addWarehouse } from "../controllers/warehouse-controllers/addWarehouse";
import { getAllWarehouse } from "../controllers/warehouse-controllers/getAllWarehouse";
import { isAuthenticated } from "../middlewares/auth-middleware";
import { authorizeRoles } from "../middlewares/role-middleware";

const router = express.Router();

// Route for creating warehouse
router.post("/add", isAuthenticated, authorizeRoles(["Admin",]), addWarehouse);
router.get("/", isAuthenticated, authorizeRoles(["Admin",]), getAllWarehouse);

export default router;
