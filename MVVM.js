// 基类 调度

// 存放watcher
class Dep {
  constructor() {
    this.subs = [] // 存放所有的watcher
  }
  // 添加观察者
  addSub(watcher) {
    this.subs.push(watcher)
  }
  // 发布
  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
}

// 观察者 (发布订阅) -> 里面存放被观察者
// vm.$watch(vm, 'school', (newV) => {})
class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm
    this.expr = expr
    this.cp = cp
    // 默认存放老值
    this.oldV = this.get()
  }
  get() {
    let val = CompileUtil.getVal(this.vm, this.expr)
    return val
  }
  // 更新操作 （数据更新后，调用观察者的update方法）
  update() {
    let newV = CompileUtil.getVal(this.vm, this.expr)
    if (newV != this.oldV) {
      this.cb(newV)
    }
  }
}

// 实现数据劫持
class Observer {
  constructor(data) {
    this.observer(data)
  }
  observer(data) {
    // 如果是对象才观察
    if (data && typeof data === 'object') {
      for (const key in data) {
        this.defineReactive(data, key, data[key])
      }
    }
  }
  defineReactive(obj, key, value) {
    this.observer(value)
    Object.defineProperty(obj, key, {
      get() {
        return value
      },
      set: (newV) => {
        if (newV != value) {
          this.observer(newV)
          value = newV
        }
      }
    })
  }
}

class Compiler {
  constructor(el, vm) {
    this.vm = vm
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    // 1、把当前节点的元素获取到，放到内存中
    let fragment = this.node2fragment(this.el)
    // 2、把节点中的内容进行替换
    // 3、用数据编译模板
    this.compile(fragment)
    // 4、把内容塞到页面中
    this.el.appendChild(fragment);
  }

  // 判断节点是否带有指令属性
  isDirective(attrName) {
    return attrName.startsWith('v-')
  }

  // 编译元素的 v-xxx
  compileElement(node) {
    let attrs = node.attributes;
    [...attrs].forEach(attr => {
      let { name, value: expr } = attr
      // v-model v-html v-text v-for v-if v-show v-on:click ...
      if (this.isDirective(name)) {
        let [, directive] = name.split('-')
        // 调用不同的指令处理 (节点，表达式，当前实例对象)
        CompileUtil[directive](node, expr, this.vm)
      }
    })
  }

  // 编译文本的  {{a}} {{b}}
  compileText(node) {
    let content = node.textContent
    if (/\{\{(.+?)\}\}/.test(content)) {
      CompileUtil['text'](node, content, this.vm)
    }
  }

  // 核心的编译方法（编译内存dom节点）
  compile(node) {
    let childNodes = node.childNodes;
    [...childNodes].forEach(child => {
      if (this.isElementNode(child)) {
        this.compileElement(child)
        this.compile(child)
      } else {
        this.compileText(child)
      }
    })
  }

  // 把节点移动到内存中
  node2fragment(node) {
    let fragment = document.createDocumentFragment()
    let firstChild
    while (firstChild = node.firstChild) {
      fragment.appendChild(firstChild)
    }
    return fragment
  }
  isElementNode(node) {
    return node.nodeType === 1
  }
}

// 编译工具（策略模式处理）
CompileUtil = {
  // 通过 expr 表达式 获取实例上的属性值
  getVal(vm, expr) {
    return expr.split('.').reduce((data, curKey) => {
      return data[curKey]
    }, vm.$data)
  },
  model(node, expr, vm) {
    let fn = this.updater['modelUpdater']
    let value = this.getVal(vm, expr)
    fn(node, value)
  },
  html() {

  },
  text(node, expr, vm) { // {{a}} {{b}}
    let fn = this.updater['textUpdater']
    let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(vm, args[1])
    })
    fn(node, content)
  },
  // 提取更新方法 (数据插入到节点中)
  updater: {
    modelUpdater(node, value) {
      node.value = value
    },
    htmlUpdater(node, value) {

    },
    textUpdater(node, value) {
      node.textContent = value
    }
  }
}

class Vue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    if (this.$el) {
      // 1、数据劫持（属性转化）
      new Observer(this.$data)
      console.log(this.$data);
      // 2、编译器
      new Compiler(this.$el, this)
    }
  }
}