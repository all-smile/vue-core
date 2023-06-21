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
}