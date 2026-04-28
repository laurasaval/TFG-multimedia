import { Router } from "express";
import { getVotingConfigController } from "../controllers/voting-config.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getVotingConfigController);

export { router as votingConfigRouter };