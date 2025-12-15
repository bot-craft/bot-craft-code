// components/generic/AuxFunctions.js

// capitalizeString
export const capitalizeString = (str) => {
    if (!str) return str;
    return str.split(' ')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
             .join(' ');
}