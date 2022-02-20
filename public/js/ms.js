/**
 * Helpers.
 */

 var s = 1000;
 var m = s * 60;
 var h = m * 60;
 var d = h * 24;
 var y = d * 365.25;
 
 /**
  * Parse or format the given `val`.
  *
  * Options:
  *
  *  - `long` verbose formatting [false]
  *
  * @param {String|Number} val
  * @param {Object} [options]
  * @throws {Error} throw an error if val is not a non-empty string or a number
  * @return {String|Number}
  * @api public
  */
 
function ms(val, options) {
   options = options || {};
   var type = typeof val;
   if (type === 'string' && val.length > 0) {
     return __parse(val);
   } else if (type === 'number' && isNaN(val) === false) {
     return options.long ? __fmtLong(val) : __fmtShort(val);
   }
   throw new Error(
     'val is not a non-empty string or a valid number. val=' +
       JSON.stringify(val)
   );
 };
 
 /**
  * Parse the given `str` and return milliseconds.
  *
  * @param {String} str
  * @return {Number}
  * @api private
  */
 
 function __parse(str) {
   str = String(str);
   if (str.length > 100) {
     return;
   }
   var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
     str
   );
   if (!match) {
     return;
   }
   var n = parseFloat(match[1]);
   var type = (match[2] || 'ms').toLowerCase();
   switch (type) {
     case 'years':
     case 'year':
     case 'yrs':
     case 'yr':
     case 'y':
       return n * y;
     case 'days':
     case 'day':
     case 'd':
       return n * d;
     case 'hours':
     case 'hour':
     case 'hrs':
     case 'hr':
     case 'h':
       return n * h;
     case 'minutes':
     case 'minute':
     case 'mins':
     case 'min':
     case 'm':
       return n * m;
     case 'seconds':
     case 'second':
     case 'secs':
     case 'sec':
     case 's':
       return n * s;
     case 'milliseconds':
     case 'millisecond':
     case 'msecs':
     case 'msec':
     case 'ms':
       return n;
     default:
       return undefined;
   }
 }
 
 /**
  * Short format for `ms`.
  *
  * @param {Number} ms
  * @return {String}
  * @api private
  */
 
 function __fmtShort(ms) {
   if (ms >= d) {
     return Math.round(ms / d) + 'd';
   }
   if (ms >= h) {
     return Math.round(ms / h) + 'h';
   }
   if (ms >= m) {
     return Math.round(ms / m) + 'm';
   }
   if (ms >= s) {
     return Math.round(ms / s) + 's';
   }
   return ms + 'ms';
 }
 
 /**
  * Long format for `ms`.
  *
  * @param {Number} ms
  * @return {String}
  * @api private
  */
 
 function __fmtLong(ms) {
   return __plural(ms, d, 'day') ||
     __plural(ms, h, 'hour') ||
     __plural(ms, m, 'minute') ||
     __plural(ms, s, 'second') ||
     ms + ' ms';
 }
 
 /**
  * Pluralization helper.
  */
 
 function __plural(ms, n, name) {
   if (ms < n) {
     return;
   }
   if (ms < n * 1.5) {
     return Math.floor(ms / n) + ' ' + name;
   }
   return Math.ceil(ms / n) + ' ' + name + 's';
 }
 

