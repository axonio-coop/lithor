
module.exports = function(code){
    return eval?.(`"use strict";(${code})`) ?? '';
}