import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

Vue.directive("test", {
  inserted () {

  },
  update (el, binding) {
      el.style.backgroundColor = binding.value ? "red" : "green";
  }
});

/**
 * 群居指令注册示例
 */
Vue.directive(
    /**
     * 指令名字
     */
    "test",
    /**
     * 简写方式，就一个函数；会在节点初始化和节点vNode更新时执行
     * @param el {HtmlElement}
     * @param binding {*}
     */
    (el, binding) => {
      console.log("......>");
      el.style.backgroundColor = binding.value ? "red" : "green";
    }
);

/**
 * 定义全局过滤器示例
 */
Vue.filter("toUp", value => {
    return value.toUpperCase();
});

new Vue({
  render: h => h(App),
}).$mount('#app')
