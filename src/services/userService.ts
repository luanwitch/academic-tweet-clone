import { apiRequest } from "./api";
import type { User } from "@/types";

type UserListResponse = {
  results: User[];
  count: number;
  next?: string | null;
  previous?: string | null;
};

type UpdateProfilePayload = {
  username?: string;
  email?: string;
  bio?: string;
  avatar?: File;
  profile_picture?: File;
};

type UploadAvatarResponse = {
  avatar: string;
};

type FollowResponse = {
  following: boolean;
  created?: boolean;
  followers_count?: number;
};

const extractUsers = (data: User[] | UserListResponse | unknown): User[] => {
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as UserListResponse).results)
  ) {
    return (data as UserListResponse).results;
  }
  return [];
};

const getUser = async (userId: number): Promise<User> => {
  return apiRequest<User>(`/users/${userId}/`, {
    auth: true,
  });
};

const getMe = async (): Promise<User> => {
  return apiRequest<User>("/users/me/", {
    auth: true,
  });
};

const uploadAvatar = async (file: File): Promise<UploadAvatarResponse> => {
  const formData = new FormData();
  formData.append("avatar", file);

  return apiRequest<UploadAvatarResponse>("/profile/upload-avatar/", {
    method: "POST",
    body: formData,
    auth: true,
  });
};

const updateProfile = async (data: UpdateProfilePayload): Promise<User> => {
  const file: File | undefined = data.profile_picture || data.avatar;

  const payload = {
    username: data.username,
    email: data.email,
    bio: data.bio,
  };

  let updatedUser = await apiRequest<User>("/users/me/", {
    method: "PATCH",
    body: JSON.stringify(payload),
    auth: true,
  });

  if (file) {
    await uploadAvatar(file);
    updatedUser = await getMe();
  }

  return updatedUser;
};

const followUser = async (userId: number): Promise<FollowResponse> => {
  return apiRequest<FollowResponse>(`/users/${userId}/follow/`, {
    method: "POST",
    auth: true,
  });
};

const unfollowUser = async (userId: number): Promise<FollowResponse> => {
  return apiRequest<FollowResponse>(`/users/${userId}/follow/`, {
    method: "DELETE",
    auth: true,
  });
};

const getFollowers = async (userId: number): Promise<UserListResponse | User[]> => {
  return apiRequest<UserListResponse | User[]>(`/users/${userId}/followers/`, {
    auth: true,
  });
};

const getFollowersList = async (userId: number): Promise<User[]> => {
  const data = await getFollowers(userId);
  return extractUsers(data);
};

const getFollowing = async (userId: number): Promise<UserListResponse | User[]> => {
  return apiRequest<UserListResponse | User[]>(`/users/${userId}/following/`, {
    auth: true,
  });
};

const getFollowingList = async (userId: number): Promise<User[]> => {
  const data = await getFollowing(userId);
  return extractUsers(data);
};

const searchUsers = async (query: string): Promise<User[]> => {
  const data = await apiRequest<User[] | UserListResponse>(
    `/users/search/?q=${encodeURIComponent(query)}`,
    {
      auth: true,
    }
  );

  return extractUsers(data);
};

const listUsers = async (): Promise<User[]> => {
  const data = await apiRequest<User[] | UserListResponse>("/users/", {
    auth: true,
  });

  return extractUsers(data);
};

export const userService = {
  getUser,
  getMe,
  updateProfile,
  uploadAvatar,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowersList,
  getFollowing,
  getFollowingList,
  searchUsers,
  listUsers,
};