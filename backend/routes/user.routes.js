import express from "express";
import {
  registerUser,
  loginUser,
  logoutuser,
  profile,
  changePassword,
  verify_otp,
  SendOtp,
  handleGooglesignin,
  refreshAccessToken,
} from "../controller/user.controller.js";
import { Router } from "express";
import { verifyjwt } from "../middleware/auth.middleware.js";
import { otpLimiter } from "../middleware/otplimiter.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();
router.route("/register").post(upload.single("avatar"),registerUser);
router.route("/signin").post(loginUser);
router.route("/logout").post(verifyjwt, logoutuser);
router.route("/profile").get(verifyjwt,profile);
router.route("/verify-otp").post(otpLimiter, verify_otp);
router.route("/send-otp").post(otpLimiter, SendOtp);
router.route("/change-password").post(changePassword);
router.route("/google-auth").post(handleGooglesignin);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
