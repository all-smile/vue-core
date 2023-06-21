// 基类 调度

// import "./observer";
// const Observer = require("./observer");
// import * as Observer from "./observer";
// import("./observer");
// import "./observer";
// console.log("Observer===", Observer);

class Vue {
  constructor(options) {
    this.$el = options.el;
    this.$data = options.data;
    let computed = options.computed;
    let methods = options.methods;
    if (this.$el) {
      // 1、数据劫持（属性转化）
      new Observer(this.$data);

      // 2、处理 computed (有依赖关系)
      // {{getNewName}} reduce vm.$data.getNewName
      for (const key in computed) {
        Object.defineProperty(this.$data, key, {
          get: () => {
            return computed[key].call(this);
          },
        });
      }
      // 代理 methods
      for (const key in methods) {
        Object.defineProperty(this, key, {
          get: () => {
            return methods[key];
          },
        });
      }
      // 3、数据代理，属性穿透，this.$data.xxx -> this.xxx
      this.proxyVm(this.$data);
      // 4、编译器
      new Compiler(this.$el, this);
    }
  }
  proxyVm(data) {
    // 遍历所有属性做代理
    for (const key in data) {
      // this[key] 返回 data[key]
      Object.defineProperty(this, key, {
        get() {
          return data[key];
        },
        set(newV) {
          data[key] = newV;
        },
      });
    }
  }
}
