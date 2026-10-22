/** @param {string} country */
export function feeForCountry(country) { return country === "India" ? { amount: 100000, currency: "INR", label: "₹1,000" } : { amount: 2500, currency: "USD", label: "US$25" }; }
