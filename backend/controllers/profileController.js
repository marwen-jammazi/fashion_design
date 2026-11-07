import Profile from "../models/Profile.js";
import asyncHandler from "../utils/asyncHandler.js";
import pick from "../utils/pick.js";

const FIELDS = [
  "name", "tagline", "bio", "photo", "email", "location", "social",
];

// there is only ever one profile document
export const getProfile = asyncHandler(async (req, res) => {
  const profile = (await Profile.findOne()) || (await Profile.create({}));
  res.json(profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = (await Profile.findOne()) || (await Profile.create({}));
  profile.set(pick(req.body, FIELDS));
  await profile.save();
  res.json(profile);
});