import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  bankList: [], // holds array of bank names like ['HDFC', 'SBI']
};

export const bankSlice = createSlice({
  name: 'bank',
  initialState,
  reducers: {
    setBankList: (state, action) => {
      // payload should be an array of strings (bank names)
      state.bankList = action.payload;
    },

    addBank: (state, action) => {
      const bank = action.payload;
      if (!state.bankList.includes(bank)) {
        state.bankList.push(bank);
      }
    },

    clearBanks: (state) => {
      state.bankList = [];
    },
  },
});

export const { setBankList, addBank, clearBanks } = bankSlice.actions;

export default bankSlice.reducer;