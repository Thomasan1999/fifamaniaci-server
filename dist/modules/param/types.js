"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types = {
    alphabetical: {
        validateRegex: /^([a-z]| )+$/i
    },
    alphabeticalExtended: {
        validateRegex: /^([\u0041-\u005a]|[\u00c0-\u024f]| )+$/i
    },
    alphanumerical: {
        validateRegex: /^(\w+| )$/i
    },
    alphanumericalExtended: {
        validateRegex: /^(\d|[\u0041-\u005a]|[\u00c0-\u024f]| )+$/i
    },
    any: {
        length: {
            min: 0,
            max: 128
        },
        validateRegex: /^(.*)$/
    },
    boolean: {
        validateRegex: /^(true|false)$/
    },
    email: {
        length: { max: 64 },
        validateRegex: /^(([^<>()\\.,;:\s@"]+(\.[^<>()\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    },
    fbLink: {
        length: { min: 25, max: 256 },
        validateRegex: /^((http|https):\/\/)(www\.)?(facebook\.com)(\/)?([^\W_]|\.){5,}$/
    },
    float: {
        max: Number.MAX_VALUE,
        validateRegex: /^([-]?\d[.\d+]?|NaN)+$/
    },
    hexadecimal: {
        validateRegex: /[0-9a-f]+/i
    },
    integer: {
        max: Number.MAX_SAFE_INTEGER,
        validateRegex: /^([-]?\d|NaN)+$/
    },
    message: {
        length: { max: 1024 }
    },
    password: {
        length: { max: 64 }
    },
    username: {
        length: { max: 32 },
        validateRegex: /^(\d|[\u0041-\u005a]|[\u00c0-\u024f]| |_|-)+$/i
    }
};
exports.default = types;
//# sourceMappingURL=types.js.map