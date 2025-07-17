import React, { useState } from 'react';
import axios from 'axios';

const YodleeIntegration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

 const startYodleeIntegration = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/v1/yodlee/AccessToken');
    const fastlinkToken = response.data.accessToken;

    const launchFastlink = () => {
      window.fastlink.open({
        fastLinkURL: 'https://fl4.sandbox.yodlee.com/authenticate/restserver/fastlink',
        accessToken: fastlinkToken,
        configName: 'Aggregation',
        params: {
          flow: 'aggregation' // Optional
        },
        onSuccess: (data) => {
          console.log('✅ FastLink success:', data);
        },
        onError: (error) => {
          console.error('❌ FastLink error:', error);
        },
        onClose: () => {
          console.log('🔒 FastLink closed');
        }
      }, 'fastlink-container');
    };

    if (!window.fastlink) {
      const script = document.createElement('script');
      script.src = 'https://cdn.yodlee.com/fastlink/v4/initialize.js';
      script.async = true;
      script.onload = launchFastlink;
      script.onerror = () => console.error('❌ Failed to load FastLink SDK');
      document.body.appendChild(script);
    } else {
      launchFastlink();
    }
  } catch (err) {
    console.error('❌ Error getting FastLink token:', err);
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Bank Account</h2>
        <p className="text-gray-600 mb-6">
          Securely link your bank to view transactions and balances.
        </p>

        <button
          onClick={startYodleeIntegration}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all
            ${isLoading
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
            } text-white flex items-center justify-center`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Connect via Yodlee'
          )}
        </button>

        {error && (
          <p className="mt-4 text-red-500 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
};

export default YodleeIntegration;
