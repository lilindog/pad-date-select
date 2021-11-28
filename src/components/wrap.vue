<template>
  <div class="comp-wrap">
    <h1>wrap</h1>
    <slot></slot>
  </div>
</template>

<script>
export const k = Symbol("wrapk1");
export default {
  name: "Wrap",
  created () {
    console.log("wrap组件created！");
    console.log(this.$parent.$options);
    const inp = this.$slots.default;
    console.log(inp);
  },
  methods: {
    onChange (...args) {
      this.$emit("change", ...args);
    }
  },
  provide: {
    [k]: "1000"
  }
}
</script>
<style scoped>
.comp-wrap {
  height: 100%;
  background: grey;
}
</style>