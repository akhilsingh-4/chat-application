import { createSlice } from "@reduxjs/toolkit";


const initialState ={
   isDirty: false,
   showModel : false,
   pendingAction: null,
   pendingValue: null,
};

const unsavedChangesSlice = createSlice({  
  name: "unsavedChanges",
  initialState,

  reducers: {
    setUnsavedChanges : (state, action) =>{
      state.isDirty = action.payload;
    },
  
    openWarningPopup :(state, action) => {
      state.showModel= true;
      state.pendingAction = action.payload.action;
      state.pendingValue= action.payload.value;

    },

    closeWarningPopup :(state) =>{
      state.showModel= false;
    },

    resetWarningState: (state) =>{
      state.isDirty = false;
      state.showModel = false;
      state.pendingAction = null;
      state.pendingValue = null;
    }
  },

});

export const { setUnsavedChanges, openWarningPopup, closeWarningPopup, resetWarningState } = unsavedChangesSlice.actions;

export default unsavedChangesSlice.reducer;  
