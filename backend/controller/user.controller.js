import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../DB/Db.js";
import ApiError from "../util/ApiError.js";
import ApiResponse from "../util/ApiResponse.js";
import asyncHandler from "../util/asynchandler.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const GenerateTokens = async (userId, email) => {
  const accessToken = jwt.sign(
    { id: userId, email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "15d" }
  );

  await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
    refreshToken,
    userId,
  ]);

  return { accessToken, refreshToken };
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, refresh_token, ...safeUser } = user;
  return { ...safeUser, _id: safeUser.id };
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, "Email already exists.");
  }

  let avatarUrl = null;
  if (req.file?.path) {
    avatarUrl = await uploadOnCloudinary(req.file.path);
    if (!avatarUrl) {
      throw new ApiError(500, "Failed to upload avatar.");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (email, password, avatar, auth_provider)
     VALUES ($1, $2, $3, 'local')
     RETURNING id, id as _id, email, avatar, auth_provider, created_at`,
    [email, hashedPassword, avatarUrl]
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result.rows[0], "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password || ""))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await GenerateTokens(user.id, user.email);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: sanitizeUser(user), accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const SendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const check = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (check.rows.length === 0) {
    throw new ApiError(404, "User does not exist");
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  await pool.query(
    "UPDATE users SET otp = $1, otp_expiry = $2, is_otp_verified = false WHERE email = $3",
    [otp, otpExpiry, email]
  );

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER || "noreply@app.com",
    to: email,
    html: `<div>Your OTP is : <b>${otp}</b> (Valid for 5 minutes)</div>`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { otp }, "OTP sent successfully to your email"));
});

const verify_otp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const result = await pool.query(
    "SELECT otp, otp_expiry FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];

  if (
    !user ||
    user.otp !== String(otp) ||
    new Date(user.otp_expiry) < new Date()
  ) {
    throw new ApiError(400, "OTP is invalid or expired");
  }

  await pool.query("UPDATE users SET is_otp_verified = true WHERE email = $1", [
    email,
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP verified successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const result = await pool.query(
    "SELECT is_otp_verified FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];

  if (!user) throw new ApiError(404, "User does not exist");
  if (!user.is_otp_verified) {
    throw new ApiError(400, "OTP has not been verified yet");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    "UPDATE users SET password = $1, otp = NULL, otp_expiry = NULL, is_otp_verified = false WHERE email = $2",
    [hashedPassword, email]
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const handleGooglesignin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) throw new ApiError(400, "Google credential is required");

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { sub: googleId, email, picture } = ticket.getPayload();

  let result = await pool.query(
    "SELECT * FROM users WHERE googleid = $1 OR email = $2",
    [googleId, email]
  );
  let user = result.rows[0];

  if (!user) {
    const insertRes = await pool.query(
      `INSERT INTO users (email, googleid, auth_provider, avatar)
       VALUES ($1, $2, 'google', $3) RETURNING *`,
      [email, googleId, picture]
    );
    user = insertRes.rows[0];
  } else if (!user.googleid) {
    const updateRes = await pool.query(
      `UPDATE users SET googleid = $1, auth_provider = 'google' WHERE id = $2 RETURNING *`,
      [googleId, user.id]
    );
    user = updateRes.rows[0];
  }

  const { accessToken, refreshToken } = await GenerateTokens(user.id, user.email);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: sanitizeUser(user), accessToken, refreshToken },
        "Google Sign-In Successful"
      )
    );
});

const logoutuser = asyncHandler(async (req, res) => {
  await pool.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [
    req.user.id || req.user._id,
  ]);

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request: Refresh token is missing");
  }

  const decoded = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const userId = decoded.id || decoded._id;

  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [userId]
  );
  const user = result.rows[0];

  if (!user || incomingRefreshToken !== user.refresh_token) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const { accessToken, refreshToken } = await GenerateTokens(user.id, user.email);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access and refresh tokens refreshed successfully"
      )
    );
});

const profile = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, "Profile fetched"));
});

export {
  registerUser,
  loginUser,
  logoutuser,
  profile,
  changePassword,
  SendOtp,
  verify_otp,
  handleGooglesignin,
  refreshAccessToken,
};
