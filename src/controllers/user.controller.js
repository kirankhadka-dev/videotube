import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import { User } from "../models/user.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  // Decide username or email  based
  // Find  the user
  // Password checck
  // Generate Access Token and Refresh Token
  // Send Token to  the  client[securel]
  // Send Response to the client

  const { email, username, password } = req.body;

  if (!username || !email) {
    throw new ApiError(400, "Username or Email is required ");
  }

  const user = await User.findOne({ $or: [{ email, username }] });

  if (!user) {
    throw new ApiError(404, "User does not exists ");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "User does not exist");
  }

  // Generate access and refresh Token:

  const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;

      await user.save({ validateBeforeSave: false });

      // Return Access Token and Refresh Token :

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(
        500,
        "Something went wrong while generating access and refresh token "
      );
    }
  };

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Send Cookie

  const options = {
    httpOnly: true,
    secure: true,
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

export { registerUser, loginUser, logoutUser };
