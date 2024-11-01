import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import { User } from "../models/user.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessTokenAndRefreshToken } from "../utils/generateRefreshAndAccessToken.js";

import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  // Get user details from frontend
  // Validation -no empty [for each field]
  // Check if user already registered
  // Check  for images, Check for avatar
  // Upload them  to Cloudinary, Check avatar
  // Create user object - create  entry in the db
  // Remove  password and refreshToken field from the respose
  // Check for the user creation
  // Return response

  // Extract data from req.body
  const { username, fullname, email, password } = req.body;

  // Validaton

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, " all fields  are required ");
  }

  // Check if user  already exists or not :

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists ");
  }

  //Check images

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if (
    req.files &&
    Arrays.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar  is required ");
  }

  // Upload file in the cloudinary [ third part services ]

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;

  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  // Create user

  const user = await User.create({
    fullname: fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email: email,
    password: password,
    username: username.toLowerCase(),
  });

  // Check user is created or not
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to register an user  ");
  }

  // Return API Response

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registerd successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Extract data from req.body
  console.log(req.body);

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required");
  }

  // Find the user based on email or username
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // // Generate access and refresh tokens
  // const generateAccessTokenAndRefreshToken = async (userId) => {
  //   try {
  //     const user = await User.findById(userId);
  //     const accessToken = user.generateAccessToken();
  //     const refreshToken = user.generateRefreshToken();

  //     user.refreshToken = refreshToken;
  //     await user.save({ validateBeforeSave: false });

  //     return { accessToken, refreshToken };
  //   } catch (error) {
  //     throw new ApiError(500, "Error generating tokens");
  //   }
  // };

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  // Select user without sensitive information
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Send cookies
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Set to true in production
  };

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
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Find user
  // Clear the cookies
  // Reset Refresh Token

  await User.findByIdAndUpdate(
    req.user_id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  // Clear cookie :

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request ");
  }

  try {
    // Verify the token :

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token ");
    }

    // Compare the token saved in db and incoming token from client

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired ");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    // Generate refresh and access Token:
    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refresh "
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Invalid Refresh Token ");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // if(!(newPassword===confirmPassword)){
  //    throw new ApiError(401,"")
  // }

  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid old password ");
  }

  user.password = newPassword; // password is set
  await user.save({ validateBeforeSave: false }); // save the user with updated credentials

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = rea.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required ");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password"); // new:True, returns the updated documents as well

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// for file  updates , hava a separate controller

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path; // multer has saved it in the local file
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar  file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }

  // update the avtar  in  db :

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar  updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path; // multer has saved it in the local file
  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage  file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }

  // update the cover image url   in  db :

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage  updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
