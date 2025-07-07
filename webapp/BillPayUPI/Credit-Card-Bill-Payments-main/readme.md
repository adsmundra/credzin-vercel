# 💳 Credit Card Bill Payments with UPI QR or App ✨

[![React](https://img.shields.io/badge/React-18+-blue?logo=react&logoColor=61DAFB)](https://reactjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) [![Framer Motion](https://img.shields.io/badge/Framer_Motion-purple?logo=framer&logoColor=white)](https://www.framer.com/motion/)

Welcome to the UPI QR Generator! This slick React web application provides a user-friendly interface to input credit card details and a mobile number, validates the information, and then cleverly generates a UPI QR code or a direct UPI payment link. It's designed to **initiate** payments via UPI, leveraging specific bank patterns, rather than processing the credit card payment directly.

**🎯 Goal:** To simplify the process of making payments *from* credit cards *via* UPI by generating the necessary UPI ID and payment link based on user input.

---

## 🖼️ Preview + Features & Tech
- 🚀 **Live Access:** [UPI Credit Card Bill Payment Tool](https://github.com/RedeemApp/cc-billpay-upi-id)

---

<table>
  <tr>
    <td width="48%">
      <img src="https://raw.githubusercontent.com/SupratimRK/Credit-Card-Bill-Payments/refs/heads/main/sc.png" alt="Live Screenshot">
    </td>
    <td width="52%">

### ✨ Features

- 📱 Grouped Mobile Number Input  
- 💳 Grouped Card Number Input  
- 🔍 Auto Card Issuer Detection  
- 🏦 Manual Bank Selection  
- ✅ Real-Time Validation  
- 🛡️ Credit Card + Indian Only Check  
- ⚙️ Dynamic UPI ID Generation  
- 🔗 `upi://` URL Generation  
- 📷 QR Code Display  
- 🚀 Mobile UPI App Launch  
- 💅 Slick UI & Animation  
- 🔄 Reset Functionality  
- 🤖 Mobile-Optimized Experience  

---

### 🛠️ Tech Stack

- ⚛️ React 18+  
- 🟦 TypeScript  
- 🌬️ Tailwind CSS  
- ✨ Framer Motion  
- 💡 Lucide Icons  
- 🔳 `qrcode.react`  
- ⚙️ Custom Utility Functions  
- 🌍 External BIN Validation API  
- ✅ Type-Safe with TypeScript Interfaces  

</td>
  </tr>
</table>

---

## 🤔 How It Works

1. **Enter Mobile:** User inputs their 10-digit mobile number into the segmented fields. 📱  
2. **Enter Card:** User inputs their 16-digit credit card number into the segmented fields. 💳  
3. **Validate Card:** As the card number is entered (specifically after 6+ digits), the `validateCard` utility function (likely calling an external BIN lookup API) is triggered.  
4. **Display Info & Auto-Select:** If validation is successful:  
   - Card scheme (Visa, Mastercard, etc.), type (Credit/Debit), and detected issuer are shown.  
   - It checks if the card is a **Credit** card issued in **India**.  
   - If valid and the detected issuer matches a bank in the `BANKS` list (`findBankByIssuer`), that bank is auto-selected. ✅  
   - If the card is invalid (not credit, not Indian), an error message is shown. ❌  
5. **Manual Selection (if needed):**  
   - If the card is valid but the issuer wasn't auto-matched, or if the user clicks "Not your issuer?", a list of supported banks (`BANKS`) is shown for manual selection. 🏦  
6. **Enter Amount (Optional):** User can specify the payment amount. 💰  
7. **Generate UPI Details:** Once the mobile number, a valid credit card number, and a selected bank are present:  
   - The `generateUpiId` function creates the bank-specific UPI ID.  
   - A `upi://pay?...` URL is constructed including the UPI ID, payee name (bank name), amount (if entered), and currency (INR). 🔗  
8. **Display QR / Button:**  
   - **Desktop/All:** A QR code containing the `upi://` URL is displayed for scanning. 🧾  
   - **Mobile:** A "Pay via UPI App" button is also shown. Clicking this button attempts to open the `upi://` URL, which mobile operating systems typically handle by showing a chooser for installed UPI apps (like GPay, PhonePe, Paytm, etc.). 🚀  

---


## 🚀 Getting Started (Development)

1. **Clone the repository:**
    ```bash
    git clone https://github.com/SupratimRK/Credit-Card-Bill-Payments.git
    cd Credit-Card-Bill-Payments
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Configure Utilities:**
    - Ensure the `../utils` directory and its files (`index.ts`, potentially others) are correctly set up.
    - Pay special attention to the `BANKS` constant (add/modify supported banks and their logos/UPI generation logic).
    - Verify the implementation of `validateCard`. If it requires an API key for an external BIN lookup service, make sure it's configured (e.g., via environment variables).
    - Check the logic within `generateUpiId` to ensure it matches the patterns required by the listed banks.

4. **Run the development server:**
    ```bash
    npm start
    ```

5. **Open your browser:** Navigate to `http://localhost:5173` (or the port specified). 🎉

---

## 🧩 Key Components & Utils

- **`PaymentForm.tsx`:** The main React component holding the state, logic, and JSX for the entire form interface.  
- **`utils.ts`:** 
  - `BANKS`: An array/object defining the supported banks, their IDs, names, logos, and potentially UPI ID patterns.  
  - `validateForm`: Function to perform basic validation on form fields (mobile, amount).  
  - `generateUpiId`: Core function to create the specific UPI ID based on mobile number and bank rules.  
  - `validateCard`: Async function to validate the card number, likely checking Luhn algorithm and fetching BIN details (issuer, type, scheme, country) from an external source.  
  - `findBankByIssuer`: Helper to match the detected card issuer string to a bank in the `BANKS` list.  
  - `getCardSchemeIcon`: Helper to return the path/URL for the card scheme logo (Visa, Mastercard, etc.).  
- **`App.tsx`:** Contains TypeScript interfaces (`FormData`, `ValidationErrors`, `CardValidationResponse`, etc.) for type safety.  

---

## ⚠️ Important Notes & Caveats

- 🚨 **NOT A PAYMENT PROCESSOR:** This application **DOES NOT** process credit card payments directly. It **DOES NOT** store sensitive card details server-side (and shouldn't!). Its sole purpose is to **generate a UPI payment link/QR code** based on the inputs. The actual payment happens entirely outside this app, within the user's chosen UPI app.  

- 🔐 **Security:** While the app doesn't store data, entering card details into *any* web form carries inherent risks. This tool should be used with caution and ideally only on trusted networks/devices. The `validateCard` function relies on an external service; ensure its privacy policy is acceptable.  

- 🏦 **UPI ID Logic:** The accuracy of the generated UPI ID depends entirely on the correctness of the logic within `generateUpiId` and the patterns defined for each bank in the `BANKS` constant. These patterns can change and might not work for all users or card types from a specific bank.  

- 🌐 **Card Validation Service:** The reliability and accuracy of the card issuer auto-detection depend on the external service used by `validateCard`. These services might have rate limits, costs, or occasional downtime.  

- 💸 **Transaction Responsibility:** The user is solely responsible for verifying the details (UPI ID, amount, payee name) in their UPI app before confirming the payment. This tool merely facilitates the initiation.  

---

## 👨‍💻 Author

Crafted with 💜 by **Supratim**

---

## 🔗 Live App & Credits

- 🚀 **Live Access:** [UPI Credit Card Bill Payment Tool](https://cc-bill.netlify.app)  
- 🙌 **Credit:** Forked and adapted from [RedeemApp/cc-billpay-upi-id](https://github.com/RedeemApp/cc-billpay-upi-id)  
- 🤝 **Contributors are most welcome!** Feel free to fork, improve, and raise a PR. Whether it's bug fixes, features, or just some code cleanup — all contributions are appreciated!
