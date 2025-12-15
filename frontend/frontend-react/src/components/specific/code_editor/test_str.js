const a = "foo/bar"

const b = "foo/bar/b"

function isPrefix(str1, str2) {
    return str2.startsWith(str1);
}

// Example usage:
// console.log(isPrefix(a, b)); // true
// console.log(isPrefix(b, a)); // false
// console.log(isPrefix(a, a)); // true

let array = [1, 2, 3, 4];
array.push(5);
// console.log(array);
// console.log(array.splice(3, 1));
// console.log(array.splice(1, 1));
// console.log([...array].reverse());

// console.log(array.includes(1)); // true
// console.log(array.lastIndexOf(1)); // 0

// console.log(array)
// console.log(array[array.length - 1])