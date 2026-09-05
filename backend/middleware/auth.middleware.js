import jwt from "jsonwebtoken";
import { pool } from "../DB/Db.js";
import ApiError from "../util/ApiError.js";
import asynchandler from "../util/asynchandler.js";

export const verifyjwt = asynchandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const userId = decodedToken.id || decodedToken._id;
  const result = await pool.query(
    "SELECT id, id as _id, email, avatar, auth_provider, is_otp_verified, created_at FROM users WHERE id = $1",
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }

  req.user = user;
  next();
});
