import * as storage from './storage.js';
import create from './create.js';
import language from './index.js';
import Key from './Key.js'

const main = create('main', '', 
  [create('h1', 'title', 'Virtual Keyboard'),
    create('h3', 'subtitle', 'This keyboard was created under macOS'),
    create('p', 'note', '* there are no <span>Delete</span> and <span>Win</span> keys on macOS keyboard'),
    create('p', 'descr', 'Use left <span>Control</span> and left <span>Option</span> to change language')]);

export default class Keyboard {
  constructor(rowsOrder) {
    this.rowsOrder = rowsOrder;
    this.keysPressed = {};
    this.isCaps = false;
  }

  init(langCode) {
    this.keyBase = language[langCode];
    this.output = create ('textarea', 'output', null, main,
      ['placeholder', 'Start typing...'],
      ['rows', 5],
      ['cols', 90],
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

    document.addEventListener('keydown', this.handleEvent);
    document.addEventListener('keyup', this.handleEvent);

    this.container.onmousedown = this.mouseEvent;
    this.container.onmouseup = this.mouseEvent;
  }

  mouseEvent = (e) => {
    e.stopPropagation();
    const keyDiv = e.target.closest('.keyboard__key');
    if (!keyDiv) return;

    const code = keyDiv.dataset.code;
    
    this.handleEvent({ code, type: e.type })
  }

  handleEvent = (e) => {
    if (e.stopPropagation) e.stopPropagation();
    const { code, type } = e;
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (!keyObj) return;
    this.output.focus();

    if (type.match(/keydown|mousedown/)) {
      if (type.match(/key/)) e.preventDefault();

      if (code.match(/Shift/)) {
        this.shiftKey = true;
        this.switchUpperCase(true)
      }

      if (code.match(/Caps/)) {
        this.isCaps = true;
        this.switchUpperCase(true)
      }
      
      keyObj.div.style.backgroundColor = 'pink';

      //change language

      if (code.match(/Control/)) this.control = true;
      if (code.match(/Alt/)) this.alt = true;

      if (code.match(/Control/) && this.alt) this.changeLang();
      if (code.match(/Alt/) && this.control) this.changeLang();

      if(!this.isCaps) {
        this.print(keyObj, this.shiftKey ? keyObj.shift : keyObj.small);
      } else if (this.isCaps) {
        if (this.shiftKey) {
          this.print(keyObj, keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        } else {
          this.print(keyObj, !keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        }
      }

    } else if (type.match(/keyup|mouseup/)) {
      keyObj.div.style.backgroundColor = '';

      if (code.match(/Control/)) this.control = false;
      if (code.match(/Alt/)) this.alt = false;

      if (code.match(/Shift/)) {
        this.shiftKey = false;
        this.switchUpperCase(false);
      }

      if (code.match(/Caps/)) {
        this.isCaps = false;
        this.switchUpperCase(false)
      }
    }
  }

  changeLang = () => {
    const langAbbr = Object.keys(language);
    let langIndex = langAbbr.indexOf(this.container.dataset.language);
    this.keyBase = langIndex + 1 < langAbbr.length ? language[langAbbr[langIndex += 1]] : language[langAbbr[langIndex -= langIndex]];

    this.container.dataset.language = langAbbr[langIndex];
    storage.set['kbLang', langAbbr[langIndex]];

    this.keyButtons.forEach((btn) => {
      const keyObj = this.keyBase.find((key) => key.code === btn.code);
      if (!keyObj) return;

      btn.small = keyObj.small;
      btn.shift = keyObj.shift;
      
      if (keyObj.shift && keyObj.shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/)) {
        btn.sub.innerHTML = keyObj.shift;
      } else {
        btn.sub.innerHTML = '';
      }

      btn.letter.innerHTML = keyObj.small;
    });

    if (this.isCaps) {
      this.switchUpperCase(true);
    }
  }

  switchUpperCase(isTrue) {
    if (isTrue) {
      this.keyButtons.forEach((btn) => {
        if (btn.sub.innerHTML && !btn.isFn) {
          if (this.shiftKey) {
            btn.sub.classList.add('sub_active');
            btn.letter.classList.add('letter_inactive');
          }
        }

        if (!btn.isFn && this.isCaps && !this.shiftKey && !btn.sub.innerHTML) {
          btn.letter.innerHTML = btn.shift;
        } else if (!btn.isFn && this.isCaps && this.shiftKey) {
          btn.letter.innerHTML = btn.small;
        } else if (!btn.isFn && !btn.sub.innerHTML) {
          btn.letter.innerHTML = btn.shift;
        }
      });
    } else {
      this.keyButtons.forEach((btn) => {
        if (btn.sub.innerHTML && !btn.isFn) {
          btn.sub.classList.remove('sub_active');
          btn.letter.classList.remove('letter_inactive');

          if (!this.isCaps) {
            btn.letter.innerHTML = btn.small;
          } else if (!this.isCaps) {
            btn.letter.innerHTML = btn.shift;
          }
        } else if (!btn.isFn) {
          if (this.isCaps) {
            btn.letter.innerHTML = btn.shift;
          } else {
            btn.letter.innerHTML = btn.small;
          }
        }
      });
    }
  }

  print(keyObj, char) {
    let cursorPos = this.output.selectionStart;
    const left = this.output.value.slice(0, cursorPos);
    const right = this.output.value.slice(cursorPos);

    const fnBtn = {
      Tab: () => {
        this.output.value = `${left}\t${right}`;
        cursorPos++;
      },
      ArrowLeft: () => {
        this.output.value = `${left}◀${right}`;
        cursorPos++;
      },
      ArrowDown: () => {
        this.output.value = `${left}▼${right}`;
        cursorPos++;
      },
      ArrowRight: () => {
        this.output.value = `${left}▶${right}`;
        cursorPos++;
      },
      ArrowUp: () => {
        this.output.value = `${left}▲${right}`;
        cursorPos++;
      },
      Enter: () => {
        this.output.value = `${left}\n${right}`;
        cursorPos++;
      },
      Space: () => {
        this.output.value = `${left} ${right}`;
        cursorPos++;
      },
      Backspace: () => {
        this.output.value = `${left.slice(0, -1)}${right}`;
        cursorPos--;
      },
    };
    if (fnBtn[keyObj.code]) {
      fnBtn[keyObj.code]();
    }

    if (!keyObj.isFn) {
      cursorPos++;
      this.output.value = `${left}${char}${right}`;
    }

    this.output.setSelectionRange(cursorPos, cursorPos);
  }
}