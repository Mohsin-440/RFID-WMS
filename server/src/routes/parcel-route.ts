import { Router } from "express";
import {
  allParcels,
  createParcel,
  deleteParcel,
  singleParcel,
  updateDispatchParcelsStatus,
  updateParcel,
  updateParcelStatus,
} from "../controllers/parcel-controller.js";
import { isAuthenticated } from "../middlewares/auth-middleware.js";
import { authorizeRoles } from "../middlewares/role-middleware.js";

const router = Router();

router.route("/add").post(isAuthenticated, createParcel);
router.route("/dispatch-parcels").post(isAuthenticated, updateDispatchParcelsStatus);
router.route("/all").get(isAuthenticated, allParcels);
router.route("/view/:id").get(isAuthenticated, singleParcel);
router.route("/edit/:id").put(isAuthenticated, updateParcel);
router.route("/status/:id").put(isAuthenticated, updateParcelStatus);
router.route("/delete/:id").delete(isAuthenticated, deleteParcel);

export default router;
