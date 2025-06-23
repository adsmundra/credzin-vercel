import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  recommendedList: [], // holds array of recommended card objects
};

export const recommendSlice = createSlice({
  name: 'recommend',
  initialState,
  reducers: {
    setRecommendedList: (state, action) => {
      // payload should be an array of card objects
      state.recommendedList = action.payload;
    },

    addRecommended: (state, action) => {
      const card = action.payload;
      const exists = state.recommendedList.some(c => c._id === card._id);
      if (!exists) {
        state.recommendedList.push(card);
      }
    },

    clearRecommended: (state) => {
      state.recommendedList = [];
    },
  },
});

export const { setRecommendedList, addRecommended, clearRecommended } = recommendSlice.actions;

export default recommendSlice.reducer;
