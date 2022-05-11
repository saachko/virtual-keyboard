import * as storage from './storage.js';
import create from './create.js';
import language from './index.js';
import Key from './Key.js'

const main = create('main', '', 
  [create('h1', 'title', 'Virtual Keyboard'),
    create('h3', 'subtitle', 'This keyboard was created under macOS'),
    create('p', 'descr', 'Use left <span>Control</span> and <span>Space</span> to change language.')]);

export default class Keyboard {
  constructor(rowsOrder) {
    this.rowsOrder = rowsOrder;
    this.keysPressed = {};
    this.isCaps = false;
  }

  init(langCode) {
    this.keyBase = language[langCode];
    this.output = create ('textarea', 'output', null, main,
      ['placeholder', 'Type here...'],
      ['rows', 5],
      ['cols', 50],
      ['spellcheck', false],
      ['autocorrect', 'off']);
    this.container = create('div', 'keyboard', null, main, ['language', langCode]);
    document.body.prepend(main);
    return this;
  }

  generateKeyboard() {
    this.keyButtons = [];
    this.rowsOrder.forEach((row, i) => {
      const rowElement = create('div', 'keyboard__row', null, this.container, ['row', i+1]);
      rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
      row.forEach((code) => {
        const keyObj = this.keyBase.find((key) => key.code === code);
        if (keyObj) {
          const keyButton = new Key(keyObj);
          this.keyButtons.push(keyButton);
          rowElement.appendChild(keyButton.div);
        }
      });
    });
  }
}