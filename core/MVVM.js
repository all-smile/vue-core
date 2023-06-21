// 基类 调度

/*
存放watcher
实现把Watcher放到每一个需要监听的属性上，当指定数据变化时触发对应的Watcher进行更新，
而不是监听所有，牵一发动全身(很耗性能)
*/
class Dep {
  constructor() {
    this.subs = [] // 存放所有的watcher
  }
  // 订阅 (添加观察者)
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
/* class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm
    this.expr = expr
    this.cb = cb
    // 默认存放老值
    this.oldV = this.get()
  }
  get() {
    Dep.target = this; // 把 Watcher 挂到 Dep 上
    // 取值，把观察者和数据关联起来
    let val = CompileUtil.getVal(this.vm, this.expr)
    Dep.target = null; // 用完即释放, 监听器之间解耦，不然任何值（不相关的属性）取值都会触发Watcher
    return val
  }
  // 更新操作 （数据更新后，调用观察者的update方法）
  update() {
    let newV = CompileUtil.getVal(this.vm, this.expr)
    if (newV != this.oldV) {
      this.cb(newV)
    }
  }
} */

// 实现数据劫持
/* class Observer {
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
    // 给每个属性增加 发布订阅 功能
    let dep = new Dep()
    Object.defineProperty(obj, key, {
      get() {
        // 创建 watcher 时会取到对应的内容， 并且把 watcher 放到全局上
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      set: (newV) => {
        if (newV != value) {
          this.observer(newV)
          value = newV
          dep.notify()
        }
      }
    })
  }
} */

/* class Compiler {
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
        let [directiveName, eventName] = directive.split(':')
        // 调用不同的指令处理 (节点，表达式，当前实例对象)
        CompileUtil[directiveName](node, expr, this.vm, eventName)
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
} */

// 编译工具（策略模式处理）
CompileUtil = {
  // 通过 expr 表达式 获取实例上的属性值
  getVal(vm, expr) {
    return expr.split('.').reduce((data, curKey) => {
      return data[curKey]
    }, vm.$data)
  },
  setVal(vm, expr, val) {
    expr.split('.').reduce((data, curKey, index, arr) => {
      if (arr.length - 1 === index) {
        // 给属性设置新值
        data[curKey] = val
      }
      return data[curKey]
    }, vm.$data)
  },
  model(node, expr, vm) {
    let fn = this.updater['modelUpdater']
    // 添加观察者 (数据更新后，会触发回调，更新视图)
    new Watcher(vm, expr, (newV) => {
      fn(node, newV)
    })
    // 监听事件 -> 双向绑定
    node.addEventListener('input', (e) => {
      let val = e.target.value
      this.setVal(vm, expr, val)
    })
    let value = this.getVal(vm, expr)
    fn(node, value)
  },
  html(node, expr, vm) { // v-html="msg"
    let fn = this.updater['htmlUpdater']
    // 添加观察者 (数据更新后，会触发回调，更新视图)
    new Watcher(vm, expr, (newV) => {
      fn(node, newV)
    })
    let value = this.getVal(vm, expr)
    fn(node, value)
  },
  on(node, expr, vm, eventName) { // v-on:click="change"
    node.addEventListener(eventName, (e) => {
      vm[expr].call(vm, e)
    })
  },
  text(node, expr, vm) { // {{a}} {{b}}
    let fn = this.updater['textUpdater']
    let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      new Watcher(vm, args[1], (newV) => {
        this.getContentValue(vm, expr)
        fn(node, newV)
      })
      return this.getVal(vm, args[1])
    })
    fn(node, content)
  },
  getContentValue(vm, expr) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(vm, args[1])
    })
  },
  // 提取更新方法 (数据插入到节点中)
  updater: {
    modelUpdater(node, value) {
      node.value = value
    },
    htmlUpdater(node, value) { // xss攻击
      node.innerHTML = value
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
    let computed = options.computed
    let methods = options.methods
    if (this.$el) {
      // 1、数据劫持（属性转化）
      new Observer(this.$data)

      // 2、处理 computed (有依赖关系)
      // {{getNewName}} reduce vm.$data.getNewName
      for (const key in computed) {
        Object.defineProperty(this.$data, key, {
          get: () => {
            return computed[key].call(this)
          },
        })
      }
      // 代理 methods
      for (const key in methods) {
        Object.defineProperty(this, key, {
          get: () => {
            return methods[key]
          },
        })
      }
      // 3、数据代理，属性穿透，this.$data.xxx -> this.xxx
      this.proxyVm(this.$data)
      // 4、编译器
      new Compiler(this.$el, this)
    }
  }
  proxyVm(data) {
    // 遍历所有属性做代理
    for (const key in data) {
      // this[key] 返回 data[key]
      Object.defineProperty(this, key, {
        get() {
          return data[key]
        },
        set(newV) {
          data[key] = newV
        }
      })
    }
  }
}