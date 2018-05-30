export const ticks = {
  snow: Symbol("snow"),
  water: Symbol("water"),
  power: Symbol("power"),
  fishDown: Symbol("fishDown"),
  fishUp: Symbol("fishUp"),
  fishHatch: Symbol("fishHatch"),
  misc: Symbol("misc"),
  input: Symbol("input")
};
export const tickOrder = [
  ticks.snow,
  ticks.water,
  ticks.power,
  ticks.fishDown,
  ticks.fishUp,
  ticks.fishHatch,
  ticks.misc,
  ticks.input
];
const spring = Symbol("spring");

export class Salmon {
  constructor(name, age, direction) {
    this.setName(name);
    this.setAge(age);
    this.setDirection(direction);
  }

  setName(name) {
    this.name = name;
  }

  setAge(age) {
    this.age = age;
  }

  setDirection(direction) {
    this.direction = direction;
  }
}

Salmon.Downstream = Symbol("downstream");
Salmon.Upstream = Symbol("Upstream");

Salmon.Young = Symbol("Young");
Salmon.Mature = Symbol("Mature");

export class Node {
  constructor(runner, parent) {
    this.runner = runner;

    this.parent = parent;
    this.children = [];

    this.salmons = [];
    this.generatingPower = false;
    this.watered = false;
    this.snowy = false;
    this.destroyed = false;
  }

  setName(name) {
    this.name = name;
  }

  generatePower() {
    this.generatingPower = true;
  }

  water() {
    this.watered = true;
  }

  makeSnowy() {
    this.snowy = true;
  }

  destroy() {
    this.destroyed = true;
    this.setName("");
  }

  powered() {
    return this.children.some(node => node.generatingPower);
  }

  addChild(childNode) {
    this.children.push(childNode);
  }

  addSalmon(salmon) {
    this.salmons.unshift(salmon);
    return true;
  }

  removeSalmon(salmon) {
    this.salmons.splice(this.salmons.indexOf(salmon), 1);
  }

  [ticks.snow]() {
    if (this.children.some(child => child.snowy)) {
      this.makeSnowy();
    }
  }

  [ticks.water]() {
    if (this.children.some(child => child.watered)) {
      this.water();
    }
  }

  [ticks.power]() {}

  [ticks.fishDown]() {
    this.salmons
      .filter(salmon => salmon.direction === Salmon.Downstream)
      .forEach(salmon => {
        if (!this.parent) {
          this.printer(salmon);
          this.removeSalmon(salmon);
        } else if (this.parent.addSalmon(salmon)) {
          this.removeSalmon(salmon);
        }
      });
  }

  [ticks.fishUp]() {
    this.salmons
      .filter(salmon => salmon.direction === Salmon.Upstream)
      .forEach(salmon => {
        // TODO: find node with salmon name and go there...

        let newNode = this;
        for (const child of this.children) {
          if (child.addSalmon(salmon)) {
            this.removeSalmon(salmon);
            newNode = child;
            break;
          }
        }

        salmon.setAge(Salmon.Mature);
        salmon.setDirection(Salmon.Downstream);
        newNode.addSalmon(new this.SalmonType(newNode.name, Salmon.Young, Salmon.Downstream));
      });
  }

  [ticks.fishHatch]() {}
  [ticks.misc]() {}
  [ticks.input]() {}

  getState() {
    const states = [];
    if (this.powered()) {
      states.push("powered");
    }
    if (this.generatingPower) {
      states.push("powering");
    }
    if (this.watered) {
      states.push("watered");
    }
    if (this.snowy) {
      states.push("snowy");
    }
    if (this.destroyed) {
      states.push("destroyed");
    }
    if (states.length) {
      states.unshift("");
    }

    return `${this.name}(${this.salmons.length} salmons${states.join(", ")})`;
  }
}
Node.prototype.SalmonType = Salmon;
Node.prototype.printer = (salmon) => { process.stdout.write(salmon.name); };


export function tokensFactory(NodeType) {
  return {
    Universe: class Universe extends NodeType {
      constructor(runner, parent) {
        super(runner, parent);
        this.setName("Universe");
      }

      [ticks.snow]() {
        super[ticks.snow]();
        if (this.snowy) {
          this.destroy();
        }
      }

      [ticks.misc]() {
        if (this.destroyed) {
          this.runner.continue = false;
        }
      }
    },

    snowmelt: class Snowmelt extends NodeType {
      constructor(runner, parent) {
        super(runner, parent);
        this.setName("snowmelt");
      }

      [ticks.snow]() {
        super[ticks.snow]();
        this.makeSnowy();
      }
    },

    net: class Net extends NodeType {
      constructor(runner, parent) {
        super(runner, parent);
        this.setName("net");
      }

      addSalmon(salmon) {
        if (salmon.age === Salmon.Mature) {
          return false;
        }
        return super.addSalmon(salmon);
      }
    },

    powers: class PowerPlant extends NodeType {
      constructor(runner, parent) {
        super(runner, parent);
        this.setName("powers");
      }

      [ticks.power]() {
        super[ticks.power]();
        this.generatePower();
      }
    },

    hatchery: class Hatchery extends NodeType {
      constructor(runner, parent) {
        super(runner, parent);
        this.setName("hatchery");
      }

      [ticks.fishHatch]() {
        super[ticks.fishHatch]();
        if (this.powered()) {
          this.addSalmon(new this.SalmonType('homeless', Salmon.Young, Salmon.Upstream)); 
        }
      }
    },

    [spring]: class Spring extends NodeType {
      constructor(runner, parent, name) {
        super(runner, parent);
        this.setName(name);
      }

      [ticks.water]() {
        super[ticks.water]();
        this.water();
      }
    },
  };
}

function _traverse(node, callers) {
  const { preOrder, inOrder, postOrder } = callers;

  if (preOrder && preOrder(node) === false) {
    return false;
  }

  for (const child of node.children) {
    _traverse(child, callers);
    if (inOrder && inOrder(node) === false) {
      return false;
    }
  }

  if (postOrder && postOrder(node) === false) {
    return false;
  }
}

export class Runner {
  constructor() {
    this.continue = true;
    this.currentTick = tickOrder[0];
    this.runs = 0;
  }

  setRoot(root) {
    this.root = root;
  }

  traverse(callers) {
    _traverse(this.root, callers);
  }

  run() {
    while (this.continue) {
      this.doTick();
    }
  }

  doTick() {
    if (!this.continue) {
      return;
    }

    switch (this.currentTick) {
      case ticks.snow:
      case ticks.water:
      case ticks.power:
      case ticks.fishDown:
      case ticks.fishHatch:
        this.traverse({
          preOrder: node => {
            node[this.currentTick]();
          }
        });
        break;

      case ticks.misc:
      case ticks.fishUp:
        this.traverse({
          postOrder: node => {
            node[this.currentTick]();
          }
        });
        break;
    }

    this.runs++;
    this.currentTick = tickOrder[this.runs % tickOrder.length];
  }
}

export function parser(input) {
  const unescapedTokens = input.split(' ');
  const tokens = [];

  let merge = false;
  for (const token of unescapedTokens) {
    if (merge) {
      tokens[tokens.length - 1] = tokens[tokens.length - 1].slice(0, -1) + ' ' + token;
    } else {
      tokens.push(token);
    }

    merge = false;
    if (token.endsWith('.')) {
      merge = true;
    }
  }

  return tokens;
}

export function tokensToTree(runner, tokens, input) {
  let rootNode = null;
  let node = null;
  for (const token of input) {
    if (token === '') {
      node = node.parent;
      continue;
    }

    let newNode;
    if (tokens[token]) {
      newNode = new tokens[token](runner, node);
    } else {
      newNode = new tokens[spring](runner, node, token);
    }
    if (!node) {
      rootNode = newNode;
    } else {
      node.addChild(newNode);
    }
    node = newNode;
  }
  return rootNode;
}

export const tokens = tokensFactory(Node);
