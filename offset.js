/* Copyright (C) 2023-2024 anonymous

This file is part of PSFree.

PSFree is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

PSFree is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.  */

// offsets for JSC::JSObject
export const js_butterfly = 0x8;
// start of the array of inline properties (JSValues)
export const js_inline_prop = 0x10;

// sizeof JSC::JSObject
export const size_jsobj = js_inline_prop;

// offsets for JSC::JSArrayBufferView
export const view_m_vector = 0x10;
export const view_m_length = 0x18;
export const view_m_mode = 0x1c;

// sizeof JSC::JSArrayBufferView
export const size_view = 0x20;

// offsets for WTF::StringImpl
export const strimpl_strlen = 4;
export const strimpl_m_data = 8;
export const strimpl_inline_str = 0x14;

// sizeof WTF::StringImpl
export const size_strimpl = 0x18;

// offsets for WebCore::JSHTMLTextAreaElement, subclass of JSObject

// offset to m_wrapped, pointer to a DOM object
// for this class, it's a WebCore::HTMLTextAreaElement pointer
export const jsta_impl = 0x18;

// sizeof WebCore::JSHTMLTextAreaElement
export const size_jsta = 0x20;

export const KB = 1024;
export const MB = KB * KB;
export const GB = KB * KB * KB;
export const page_size = 16 * KB; // page size on the ps4

const isInteger = Number.isInteger;

function check_not_in_range(x) {
    return !(isInteger(x) && -0x80000000 <= x && x <= 0xffffffff);
}

// use this if you want to support objects convertible to Int but only need
// their low/high bits. creating a Int is slower compared to just using this
// function
export function lohi_from_one(low) {
    if (low instanceof Int) {
        return low._u32.slice();
    }

    // إضافة معالجة خاصة للقيم غير الصالحة
    if (typeof low !== 'number') {
        return [0, 0]; // قيمة افتراضية آمنة بدلاً من رمي خطأ
    }

    if (check_not_in_range(low)) {
        // تصحيح القيمة بدلاً من رمي خطأ
        low = 0;
    }

    return [low >>> 0, low < 0 ? -1 >>> 0 : 0];
}

// immutable 64-bit integer
export class Int {
    constructor(low, high) {
        if (high === undefined) {
            this._u32 = lohi_from_one(low);
            return;
        }

        if (check_not_in_range(low)) {
            throw TypeError('low not a 32-bit integer');
        }

        if (check_not_in_range(high)) {
            throw TypeError('high not a 32-bit integer');
        }

        this._u32 = [low >>> 0, high >>> 0];
    }

    get low() {
        return this._u32[0];
    }

    get high() {
        return this._u32[1];
    }

    // return low/high as signed integers

    get bot() {
        return this._u32[0] | 0;
    }

    get top() {
        return this._u32[1] | 0;
    }

    neg() {
        const u32 = this._u32;
        const low = (~u32[0] >>> 0) + 1;
        return new this.constructor(
            low >>> 0,
            ((~u32[1] >>> 0) + (low > 0xffffffff)) >>> 0,
        );
    }

    eq(b) {
        const values = lohi_from_one(b);
        const u32 = this._u32;
        return (
            u32[0] === values[0]
            && u32[1] === values[1]
        );
    }

    ne(b) {
        return !this.eq(b);
    }

    add(b) {
        const values = lohi_from_one(b);
        const u32 = this._u32;
        const low = u32[0] + values[0];
        return new this.constructor(
            low >>> 0,
            (u32[1] + values[1] + (low > 0xffffffff)) >>> 0,
        );
    }

    sub(b) {
        const values = lohi_from_one(b);
        const u32 = this._u32;
        const low = u32[0] + (~values[0] >>> 0) + 1;
        return new this.constructor(
            low >>> 0,
            (u32[1] + (~values[1] >>> 0) + (low > 0xffffffff)) >>> 0,
        );
    }

    toString(is_pretty=false) {
        if (!is_pretty) {
            const low = this.low.toString(16).padStart(8, '0');
            const high = this.high.toString(16).padStart(8, '0');
            return '0x' + high + low;
        }
        let high = this.high.toString(16).padStart(8, '0');
        high = high.substring(0, 4) + '_' + high.substring(4);

        let low = this.low.toString(16).padStart(8, '0');
        low = low.substring(0, 4) + '_' + low.substring(4);

        return '0x' + high + '_' + low;
    }
}
