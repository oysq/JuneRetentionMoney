/**
 * 判空
  */
function isEmpty (val) {
    // null or undefined
    if (val == null) return true;

    if (typeof val === 'boolean') return false;

    if (typeof val === 'number') return !val;

    if (val instanceof Error) return val.message === '';

    switch (Object.prototype.toString.call(val)) {
        // String or Array
        case '[object String]':
        case '[object Array]':
            return !val.length;

        // Map or Set or File
        case '[object File]':
        case '[object Map]':
        case '[object Set]': {
            return !val.size;
        }
        // Plain Object
        case '[object Object]': {
            return !Object.keys(val).length;
        }
    }

    return false;
}

/**
 * 获取UUID
 * @returns {string}
 */
function getUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 求数组某个长度内的排列
 * arr: 数组
 * num：最大个数，num=3 时，表示1、2、3这三种数量级的排列
 */
function permutation(arr, num) {
    let resArr = []; // [[A], [A, B], [A, B, C], ...]
    let iNow = 0;

    function change(aList, bList, iNow) {
        for (let i = 0; i < bList.length; i++) {

            // 为了不产生引用关系
            let _aList = aList.concat();
            let _bList = bList.concat();

            let _tmp = _bList.splice(i, 1); // 依次去掉 A B C D
            _aList.push(_tmp[0])

            // 加入结果集
            resArr.push(_aList)

            if (iNow < num) {
                change(_aList, _bList, iNow + 1); // 下一层  递归
            }
        }
    }
    change([], arr, iNow + 1);

    return resArr;
}

/**
 * 数组求和
 */
function arrSum(list) {
    if(isEmpty(list)) {
        return 0
    }
    let sum = 0
    list.forEach(item => {
        sum = round(add(sum, item), 4)
    })
    return sum
}

/**
 * 是否是数值
 * @param value
 * @returns {boolean}
 */
function isNumber(value) {
    return (typeof value === 'number' && !isNaN(value));
}

/**
 * 加
 */
function add(num1, num2){
    return math.format(math.chain(math.bignumber(num1)).add(math.bignumber(num2)).done());
}

/**
 * 减
 */
function subtract(num1, num2){
    return math.format(math.chain(math.bignumber(num1)).subtract(math.bignumber(num2)).done());
}

/**
 * 乘
 */
function multiply(num1, num2){
    return math.format(math.chain(math.bignumber(num1)).multiply(math.bignumber(num2)).done());
}

/**
 * 除
 */
function divide(num1, num2){
    return math.format(math.chain(math.bignumber(num1)).divide(math.bignumber(num2)).done());
}

/**
 * 保留几位小数
 */
function round(num, n) {
    return parseFloat(parseFloat(num).toFixed(n))
}
// function round(num, n){
//     if(n <= 0) {
//         return Math.round(num);
//     }
//     const _n = n * 10
//     return Math.round(multiply(num, _n)) / _n;
// }

