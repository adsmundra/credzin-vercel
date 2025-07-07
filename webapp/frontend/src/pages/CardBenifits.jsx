// import React from 'react';
// import { useSelector } from 'react-redux';

// const CardBenifits = () => {
//     const selectedCard = useSelector(state => state.cart.selectedCard);

//     console.log("Selected Card:", selectedCard);


//     if (!selectedCard) {
//         return <p className="text-white p-4">No card selected. Please go back and select a card.</p>;
//     }

//     return (
//         <div
//             className="relative flex w-full min-h-screen flex-col bg-[#121416] dark group/design-root overflow-x-hidden"
//             style={{ fontFamily: "Inter, Noto Sans, sans-serif" }}
//         >
//             <div className="layout-container flex h-full grow flex-col">
//                 <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#2c3135] px-10 py-3">
//                     <div className="flex items-center gap-4 text-white">
//                         <div className="size-4">
//                             <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                 <path
//                                     d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
//                                     fill="currentColor"
//                                 />
//                             </svg>
//                         </div>
//                         <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">IndianOil Axis Bank Credit Card</h2>
//                     </div>
//                     {/* <div className="flex flex-1 justify-end gap-8">
//                 <div className="flex items-center gap-9">
//                   <a className="text-white text-sm font-medium leading-normal" href="fd">Overview</a>
//                   <a className="text-white text-sm font-medium leading-normal" href="sdf">Features</a>
//                   <a className="text-white text-sm font-medium leading-normal" href="sdf">Rewards</a>
//                   <a className="text-white text-sm font-medium leading-normal" href="sdf">Apply Now</a>
//                 </div>
//                 <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#2c3135] text-white text-sm font-bold leading-normal tracking-[0.015em]">
//                   <span className="truncate">Sign In</span>
//                 </button>
//               </div> */}
//                 </header>
//                 <div className="px-40 flex flex-1 justify-center py-5">
//                     <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
//                         <div className="@container">
//                             <div className="@ [480px]:p-4">
//                                 <div
//                                     className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-center justify-center p-4"
//                                     style={{
//                                         backgroundImage:
//                                             // 'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuB-ifmCuq0pgJz42hmWqnxHCocVMVSXeSBGKH6r1tzW9HnB-lb-VNjnE6VQE13wkqF6hj9KL2U4zaZJZdLC_xH4Hgr8YBqWcA8sdfoootehK7BYS1zlyjbSicY3p8Jc0iwTAzFwJRlQZOLIGMQ9WJ_RtifF_9aoNS40oe0UpUvQgnsm2v8TxkoKrCyqEmv843WPLqug7hSh7rtUgXsuCpUy121nqY0YfbbrENewopjS7gyvR_x5SXnGIVy1qSb7NnEOQ95yyMPbXzI")',
//                                             `linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url(${selectedCard.image_url || "https://via.placeholder.com/960x480"})`,
//                                     }}

//                                     // style={{
//                                     //     backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4)), url(${selectedCard.image_url || "https://via.placeholder.com/960x480"})`,
//                                     //     backgroundSize: 'cover',
//                                     //     backgroundPosition: 'center',
//                                     //     backgroundRepeat: 'no-repeat',
//                                     //   }}
                                      

//                                 >
//                                     <div className="flex flex-col gap-2 text-center">
//                                         <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl">
//                                             Unlock Exclusive Benefits
//                                         </h1>
//                                         <h2 className="text-white text-sm font-normal leading-normal @[480px]:text-base">
//                                             Experience the premium lifestyle with our exclusive credit card. Enjoy unparalleled rewards, travel perks, and more.
//                                         </h2>
//                                     </div>
//                                     <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-[#dce8f3] text-[#121416] text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base">
//                                     <a href={selectedCard.apply_now_link} target='blank'>Apply Now</a>
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Key Features Table */}
//                         <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Key Features</h2>
//                         <div className="px-4 py-3 @container">
//                             <div className="flex overflow-hidden rounded-xl border border-[#40484f] bg-[#121416]">
//                                 <table className="flex-1">
//                                     <thead>

//                                         <tr className="bg-[#1e2124]">
//                                             <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium">Features</th>
//                                             <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium">Description</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {Object.keys(selectedCard).map((key) => (
//                                             <tr className="border-b border-[#40484f]" key={key}>
//                                                 <td className="px-4 py-3 text-white text-sm font-normal">{key}</td>
//                                                 {/* <td className="px-4 py-3 text-white text-sm font-normal">{selectedCard[key]}</td> */}
//                                                 <td className="px-4 py-3 text-white text-sm font-normal"> {typeof selectedCard[key] === 'object'
//                                                     ? JSON.stringify(selectedCard[key])
//                                                     : selectedCard[key]?.toString() || 'N/A'}</td>

//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div>

//                         {/* Rewards Section */}
//                         {/* <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-7">Rewards</h2>
//                         <div className="px-4 py-3 @container">
//                             <div className="flex overflow-hidden rounded-xl border border-[#40484f] bg-[#121416]">
//                                 <table className="flex-1">
//                                     <thead>
//                                         <tr className="bg-[#1e2124]">
//                                             <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium">Feature</th>
//                                             <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium">Description</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         <tr className="border-b border-[#40484f]">
//                                             <td className="px-4 py-3 text-white text-sm font-normal">fdfd</td>
//                                             <td className="px-4 py-3 text-white text-sm font-normal">fdfd</td>

//                                         </tr>
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div> */}



//                         {/* Features Section */}
//                         {/* <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-7">Feature</h2>
//                         <div className="px-4 py-3 @container">
//                             <div className="flex overflow-hidden rounded-xl border border-[#40484f] bg-[#121416]">
//                                 <table className="flex-1">
//                                     <thead>
//                                         <tr className="bg-[#1e2124]">
//                                             <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium">Feature</th>
//                                             <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium">Description</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         <tr className="border-b border-[#40484f]">
//                                             <td className="px-4 py-3 text-white text-sm font-normal">fdfd</td>
//                                             <td className="px-4 py-3 text-white text-sm font-normal">fdfd</td>

//                                         </tr>
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div> */}


//                         <div className="flex justify-stretch">
//                             <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
//                                 <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#2c3135] text-white text-sm font-bold leading-normal tracking-[0.015em]">
//                                 <a href={selectedCard.know_more_link} target='blank'>Know More</a>

//                                 </button>
//                                 <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#dce8f3] text-[#121416] text-sm font-bold leading-normal tracking-[0.015em]">
//                                     <a href={selectedCard.apply_now_link} target='blank'>Apply Now</a>
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* <footer className="flex justify-center">
//                     <div className="flex max-w-[960px] flex-1 flex-col">
//                         <div className="flex flex-col gap-6 px-5 py-10 text-center @container">
//                             <div className="flex flex-wrap items-center justify-center gap-6">
//                                 <a className="text-[#a2abb3] text-base font-normal leading-normal min-w-40" href="fdf">Terms & Conditions</a>
//                                 <a className="text-[#a2abb3] text-base font-normal leading-normal min-w-40" href="dfd">Privacy Policy</a>
//                                 <a className="text-[#a2abb3] text-base font-normal leading-normal min-w-40" href="fds">Contact Us</a>
//                             </div>
//                             <p className="text-[#a2abb3] text-base font-normal leading-normal">
//                                 © 2023 IndianOil Axis Bank Credit Card. All rights reserved.
//                             </p>
//                         </div>
//                     </div>
//                 </footer> */}
//             </div>
//         </div>
//     );
// }

// export default CardBenifits








import React from 'react';
import { useSelector } from 'react-redux';

const CardBenifits = () => {
    const selectedCard = useSelector(state => state.cart.selectedCard);

    if (!selectedCard) {
        return <p className="text-white p-4">No card selected. Please go back and select a card.</p>;
    }

    return (
        <div className="relative flex w-full min-h-screen flex-col bg-[#121416] overflow-x-hidden" style={{ fontFamily: "Inter, Noto Sans, sans-serif" }}>
            <div className="flex h-full grow flex-col">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-[#2c3135] px-4 sm:px-6 md:px-10 py-3">
                    <div className="flex items-center gap-4 text-white">
                        <div className="w-4 h-4">
                            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </div>
                        <h2 className="text-white text-lg font-bold">IndianOil Axis Bank Credit Card</h2>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex flex-1 justify-center py-5 px-4 sm:px-10 lg:px-20 xl:px-40">
                    <div className="flex flex-col max-w-[960px] w-full">
                        {/* Hero Section */}
                        <div className="flex min-h-[400px] flex-col gap-6 items-center justify-center rounded-xl bg-cover bg-center bg-no-repeat p-4 sm:p-8 text-center"
                            style={{
                                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4)), url(${selectedCard.image_url || "https://via.placeholder.com/960x480"})`
                            }}>
                            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
                                Unlock Exclusive Benefits
                            </h1>
                            <h2 className="text-white text-sm sm:text-base max-w-xl">
                                Experience the premium lifestyle with our exclusive credit card. Enjoy unparalleled rewards, travel perks, and more.
                            </h2>
                            <a href={selectedCard.apply_now_link} target="_blank" rel="noopener noreferrer">
                                <button className="rounded-full bg-[#dce8f3] text-[#121416] px-5 py-2 sm:py-3 text-sm sm:text-base font-bold">
                                    Apply Now
                                </button>
                            </a>
                        </div>

                        {/* Key Features */}
                        <h2 className="text-white text-xl sm:text-2xl font-bold pt-6 pb-3 px-2">Key Features</h2>
                        <div className="overflow-x-auto px-2">
                            <table className="min-w-full border border-[#40484f] bg-[#121416] rounded-xl overflow-hidden">
                                <thead className="bg-[#1e2124]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-white text-sm font-medium min-w-[200px]">Features</th>
                                        <th className="px-4 py-3 text-left text-white text-sm font-medium min-w-[200px]">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(selectedCard).map((key) => (
                                        <tr key={key} className="border-t border-[#40484f]">
                                            <td className="px-4 py-3 text-white text-sm">{key}</td>
                                            <td className="px-4 py-3 text-white text-sm">
                                                {typeof selectedCard[key] === 'object'
                                                    ? JSON.stringify(selectedCard[key])
                                                    : selectedCard[key]?.toString() || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 px-2 py-6">
                            <a href={selectedCard.know_more_link} target="_blank" rel="noopener noreferrer">
                                <button className="rounded-full bg-[#2c3135] text-white px-5 py-2 text-sm font-bold">
                                    Know More
                                </button>
                            </a>
                            <a href={selectedCard.apply_now_link} target="_blank" rel="noopener noreferrer">
                                <button className="rounded-full bg-[#dce8f3] text-[#121416] px-5 py-2 text-sm font-bold">
                                    Apply Now
                                </button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardBenifits;

