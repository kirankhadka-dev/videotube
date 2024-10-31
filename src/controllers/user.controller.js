import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import User from "../models/user.model.js";

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
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export { registerUser };
