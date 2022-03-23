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
}