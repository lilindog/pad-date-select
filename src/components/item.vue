<template>
  <input @input="onInput"/>
</template>

<script>
import { k } from "./wrap.vue";
export default {
  name: "item",
  inject: {
    pp: {
      from: k,
      default: null
    }
  },
  mounted () {
    console.log("》》》》》");
    console.log(this);
    console.log(k);
  },
  methods: {
    onInput (...args) {
      this.$parent.onChange(...args);
    }
  }
}
</script>

<style scoped>

</style>