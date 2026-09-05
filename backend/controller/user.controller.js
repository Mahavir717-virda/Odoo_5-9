import { User } from "../models/user.model.js";
import asyncHandler from "../util/asynchandler.js";
import ApiError from "../util/ApiError.js";
import ApiResponse from "../util/ApiResponse.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import asynchandler from "../util/asynchandler.js";
import { upload } from "../middleware/multer.middleware.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";
dotenv.config({ path: "../.env" });

const options = {
  httpOnly: true,
  secure: true,
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const GenerateRefreshAndAccessToken = async function (UserId) {
  try {
    const user = await User.findById(UserId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateaccesstoken();
    const refreshToken = user.generaterefreshtoken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      error.message || "Something went wrong while generating tokens",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists." });
    }

    // Get LocalFilepath from multer
    const avatarlocalpath = req.file?.path;

    let avatarurl = "";
    if (avatarlocalpath) {
      avatarurl = await uploadOnCloudinary(avatarlocalpath);

      if (!avatarurl) {
        throw new ApiError(500, "Failed to upload avatar to cloud storage.");
      }
    }

    const user = await User.create({
      email,
      password,
      avatar: avatarurl || undefined,
    });

    return res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    console.error(err);
    // duplicate key error might still occur if DB has existing null duplicates or concurrent requests
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Duplicate key error: " + err.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email or password is missing");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const ispasswordValid = await user.isPasswordCorrect(password);
  if (!ispasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } = await GenerateRefreshAndAccessToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  // your cookie can modify by anyone for that we have to set options for cookie

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully",
      ),
    );
});

const generateOtp = () => {
  return String(Math.floor(1000 + Math.random() * 9000));
};

const SendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const otp = generateOtp();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: "virdamahavir7@gmail.com",
    to: email,
    html: `<div> Your Otp is : ${otp} </div>`,
  });

  if (!info) {
    throw new ApiError(500, "Server Error");
  }

  console.log("Message sent: %s", info.messageId);

  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  user.isOtpVerified = false;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, { otp }, "OTP sent successfully to your email"));
});

const verify_otp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (
    !user.otp ||
    String(user.otp) !== String(otp) ||
    user.otpExpiry < Date.now()
  ) {
    throw new ApiError(400, "OTP is invalid or expired");
  }

  user.isOtpVerified = true;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP verified successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (!user.isOtpVerified) {
    throw new ApiError(400, "OTP has not been verified yet");
  }

  user.password = password;
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.isOtpVerified = false;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const handleGooglesignin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new ApiError(400, "Google credential is required");
  }

  // Verify the Google ID token
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { sub: googleId, email } = payload;
  // sub = Google's unique user ID, email = user's gmail

  // 1. Check if user already exists with this Google ID
  let user = await User.findOne({ googleid: googleId });

  if (!user) {
    // 2. Check if a user with same email exists (email+password user)
    user = await User.findOne({ email });

    if (user) {
      // Link Google ID to existing account
      user.googleid = googleId;
      user.authProvider = "google";
      await user.save({ validateBeforeSave: false });
    } else {
      // 3. Create a brand new user (no password needed)
      user = await User.create({
        email,
        googleid: googleId,
        authProvider: "google",
      });
    }
  }

  // Generate tokens — same as normal login
  const { accessToken, refreshToken } = await GenerateRefreshAndAccessToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Google Sign-In Successful",
      ),
    );
});

const logoutuser = asyncHandler(async (req, res) => {
  // refresh Token is removed from DB
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    },
  );

  // Now remove from Cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request: Refresh token is missing");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or has been used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await GenerateRefreshAndAccessToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access and refresh tokens refreshed successfully",
        ),
      );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const profile = asynchandler(async (req, res) => {
  res.status(200).json(req.user, "Found!!");
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
