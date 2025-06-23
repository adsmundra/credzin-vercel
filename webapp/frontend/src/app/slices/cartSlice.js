import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    cart: [],

}

export const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        setCart: (state, action) => {
            state.cart = action.payload
        },

        addToCart: (state, action) => {
            if (Array.isArray(action.payload)) {
                // Add multiple items while preventing duplicates
                action.payload.forEach(item => {
                    const exists = state.cart.some(cartItem => cartItem._id === item._id);
                    if (!exists) {
                        state.cart.push({ ...item });
                    }
                });
            } else {
                // If it's a single item, check and add if it doesn't exist
                const exists = state.cart.some(cartItem => cartItem._id === action.payload._id);
                if (!exists) {
                    state.cart.push({ ...action.payload });
                }
            }
        },
    
        removeFromCart: (state, action) => {
            
                state.cart = state.cart.filter(item => item._id !== action.payload);
    
        },
       
       
    },
})

export const { setCart, addToCart, removeFromCart } = cartSlice.actions

export default cartSlice.reducer;