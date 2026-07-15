import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
};

const normalizeUser = (user) => {
  if (!user?.id) return null;

  return {
    id: String(user.id),
    name: user.name || "Signed-in user",
    email: user.email || "No email shared",
    picture: user.picture || user.profile_picture || "",
    token: user.token || "",
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const user = normalizeUser(action.payload);
      state.user = user;
      state.isAuthenticated = Boolean(user);
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
