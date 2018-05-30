import * as hs from './homespring.js';

const nodeTpl = document.getElementById('node');
const salmonTpl = document.getElementById('salmon');

const runsEl = document.querySelector('.runs');
const ticksNEl = document.querySelector('.ticksN');
const tickEl = document.querySelector('.tick');
const outputEl = document.querySelector('.output');

function print(str) {
  outputEl.innerText += str;
}

class HTMLSalmon extends hs.Salmon {
  constructor(name, age, direction) {
    super(name, age, direction);

    const tpl = document.importNode(salmonTpl.content, true);
    this.el = tpl.querySelector('span');
    this.setName(name);
    this.setAge(age);
    this.setDirection(direction);
  }

  setName(name) {
    super.setName(name);

    if (this.el) {
      this.el.querySelector('.name').innerText = name;
    }
  }

  setDirection(direction) {
    super.setDirection(direction);

    if (this.el) {
      if (direction === hs.Salmon.Downstream) {
        this.el.classList.remove('upstream');
      } else if (direction === hs.Salmon.Upstream) {
        this.el.classList.add('upstream');
      }
    }
  }
}

class HTMLNode extends hs.Node {
  constructor(runner, parent) {
    super(runner, parent);

    const tpl = document.importNode(nodeTpl.content, true);
    this.el = tpl.querySelector('li');
  }

  setName(name) {
    super.setName(name);
    this.el.children[0].innerText = name;
  }

  generatePower() {
    super.generatePower();
    this.el.classList.add('is-generating-power');
  }

  water() {
    super.water();
    this.el.classList.add('is-watered');
  }

  makeSnowy() {
    super.makeSnowy();
    this.el.classList.add('is-snowy');
  }

  destroy() {
    super.destroy();
    this.el.classList.add('is-destroyed');
  }
  
  powered() {
    return this.children.some(node => node.generatingPower);
  }

  addChild(childNode) {
    super.addChild(childNode);
    this.el.querySelector('.children').appendChild(childNode.el);
  }

  addSalmon(salmon) {
    if (!super.addSalmon(salmon)) {
      return false;
    }

    this.el.querySelector('.salmons').appendChild(salmon.el);
    return true;
  }
}
HTMLNode.prototype.SalmonType = HTMLSalmon;
HTMLNode.prototype.printer = (salmon) => {
  print(salmon.name);
  salmon.el.parentNode.removeChild(salmon.el);
};


class HTMLRunner extends hs.Runner {
  doTick() {
      if (!this.continue) {
        runsEl.innerText = "Ended!";
      } else {
        runsEl.innerText = 1 + Math.floor(this.runs / hs.tickOrder.length);
        ticksNEl.innerText = this.runs;
        tickEl.innerText = this.currentTick.toString();
      }
      super.doTick();
  }
}

function clear() {
  document.querySelector('.target').innerHTML = '';
  document.querySelector('.output').innerText = '';
}

document.querySelector(".boot").addEventListener("click", () => {
  clear();
  starter(document.querySelector(".program").value);
});

document.querySelector(".doTick").addEventListener("click", () => {
  runner.doTick();
});

const tokens = hs.tokensFactory(HTMLNode);

let runner = null;
function starter(input) {
  const parsed = hs.parser(input)
  runner = new HTMLRunner();
  const root = hs.tokensToTree(runner, tokens, parsed);
  runner.setRoot(root);
  document.querySelector(".target").appendChild(root.el);
}

function runny() {
  if (!runner.continue) {
    return;
  }
  runner.doTick();
  setTimeout(runny, 200);
}
document.querySelector(".run").addEventListener("click", runny);
document.querySelector(".stop").addEventListener("click", () => { runner.continue = false; });
