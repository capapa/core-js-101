/* ************************************************************************************************
 *                                                                                                *
 * Please read the following tutorial before implementing tasks:                                   *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object        *
 *                                                                                                *
 ************************************************************************************************ */

/**
 * Returns the rectangle object with width and height parameters and getArea() method
 *
 * @param {number} width
 * @param {number} height
 * @return {Object}
 *
 * @example
 *    const r = new Rectangle(10,20);
 *    console.log(r.width);       // => 10
 *    console.log(r.height);      // => 20
 *    console.log(r.getArea());   // => 200
 */
function Rectangle(width, height) {
  this.width = width;
  this.height = height;
  this.getArea = () => this.width * this.height;
}

/**
 * Returns the JSON representation of specified object
 *
 * @param {object} obj
 * @return {string}
 *
 * @example
 *    [1,2,3]   =>  '[1,2,3]'
 *    { width: 10, height : 20 } => '{"height":10,"width":20}'
 */
function getJSON(obj) {
  return JSON.stringify(obj);
}

/**
 * Returns the object of specified type from JSON representation
 *
 * @param {Object} proto
 * @param {string} json
 * @return {object}
 *
 * @example
 *    const r = fromJSON(Circle.prototype, '{"radius":10}');
 *
 */
function fromJSON(proto, json) {
  const obj = JSON.parse(json);
  Object.setPrototypeOf(obj, proto);
  return obj;
}

/**
 * Css selectors builder
 *
 * Each complex selector can consists of type, id, class, attribute, pseudo-class
 * and pseudo-element selectors:
 *
 *    element#id.class[attr]:pseudoClass::pseudoElement
 *              \----/\----/\----------/
 *              Can be several occurrences
 *
 * All types of selectors can be combined using the combination ' ','+','~','>' .
 *
 * The task is to design a single class, independent classes or classes hierarchy
 * and implement the functionality to build the css selectors using the provided cssSelectorBuilder.
 * Each selector should have the stringify() method to output the string representation
 * according to css specification.
 *
 * Provided cssSelectorBuilder should be used as facade only to create your own classes,
 * for example the first method of cssSelectorBuilder can be like this:
 *   element: function(value) {
 *       return new MySuperBaseElementSelector(...)...
 *   },
 *
 * The design of class(es) is totally up to you, but try to make it as simple,
 * clear and readable as possible.
 *
 * @example
 *
 *  const builder = cssSelectorBuilder;
 *
 *  builder.id('main').class('container').class('editable').stringify()
 *    => '#main.container.editable'
 *
 *  builder.element('a').attr('href$=".png"').pseudoClass('focus').stringify()
 *    => 'a[href$=".png"]:focus'
 *
 *  builder.combine(
 *      builder.element('div').id('main').class('container').class('draggable'),
 *      '+',
 *      builder.combine(
 *          builder.element('table').id('data'),
 *          '~',
 *           builder.combine(
 *               builder.element('tr').pseudoClass('nth-of-type(even)'),
 *               ' ',
 *               builder.element('td').pseudoClass('nth-of-type(even)')
 *           )
 *      )
 *  ).stringify()
 *    => 'div#main.container.draggable + table#data ~ tr:nth-of-type(even)   td:nth-of-type(even)'
 *
 *  For more examples see unit tests.
 */

class BaseSelector {
  constructor(args) {
    this.parent = args.parent;
    this.val = { ...args };
    if (args.element) this.name = args.element;
    if (args.id) this.name = `#${args.id}`;
    if (args.class) this.name = `.${args.class}`;
    if (args.attr) this.name = `[${args.attr}]`;
    if (args.pseudoClass) this.name = `:${args.pseudoClass}`;
    if (args.pseudoElement) this.name = `::${args.pseudoElement}`;

    this.selector1 = args.selector1;
    this.combinator = args.combinator;
    this.selector2 = args.selector2;

    ['element', 'id', 'pseudoElement'].forEach((nameReq) => {
      if (!this.val[nameReq]) return;
      let checkParent = args;
      while (checkParent) {
        checkParent = checkParent.parent;
        if (checkParent && checkParent.val && checkParent.val[nameReq]) {
          throw new Error(
            // eslint-disable-next-line comma-dangle
            'Element, id and pseudo-element should not occur more then one time inside the selector'
          );
        }
      }
    });

    const order = [
      'element',
      'id',
      'class',
      'attr',
      'pseudoClass',
      'pseudoElement',
    ];
    for (let i = 0; i < order.length - 1; i += 1) {
      const nameReq = order[i];
      // eslint-disable-next-line no-continue
      if (!this.val[nameReq]) continue;
      const restElements = order.slice(i + 1);
      let checkParent = args;
      while (checkParent) {
        checkParent = checkParent.parent;
        if (checkParent && checkParent.val) {
          const parVal = { ...checkParent.val };
          if (restElements.filter((req) => parVal[req]).length > 0) {
            throw new Error(
              // eslint-disable-next-line comma-dangle
              'Selector parts should be arranged in the following order: element, id, class, attribute, pseudo-class, pseudo-element'
            );
          }
        }
      }
    }
  }
}

const cssSelectorBuilder = {
  getNewSelector(arg) {
    const obj = new BaseSelector({ ...arg, parent: this });
    return Object.setPrototypeOf(obj, this);
  },

  stringify() {
    let res = '';
    if (this.parent) res += this.parent.stringify();
    if (this.name) res += this.name;
    if (this.selector1) {
      res += `${this.selector1.stringify()} ${
        this.combinator
      } ${this.selector2.stringify()}`;
    }
    return res;
  },

  element(value) {
    return this.getNewSelector({ element: value });
  },

  id(value) {
    return this.getNewSelector({ id: value });
  },

  class(value) {
    return this.getNewSelector({ class: value });
  },

  attr(value) {
    return this.getNewSelector({ attr: value });
  },

  pseudoClass(value) {
    return this.getNewSelector({ pseudoClass: value });
  },

  pseudoElement(value) {
    return this.getNewSelector({ pseudoElement: value });
  },

  combine(selector1, combinator, selector2) {
    return this.getNewSelector({ selector1, combinator, selector2 });
  },
};

module.exports = {
  Rectangle,
  getJSON,
  fromJSON,
  cssSelectorBuilder,
};
