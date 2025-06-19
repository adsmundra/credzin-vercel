import React from 'react';

function Dropdown({ label, options, value, onChange }) {
    return (
        <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-2">{label}</label>
            <select 
                value={value} 
                onChange={onChange} 
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
                {options.map((option, index) => (
                    <option key={index} value={option.value} className="text-gray-700">
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default Dropdown;
