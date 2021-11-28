<template>
  <div class="app">
    <button @click="test">test</button>
    <date-select :y="year" :m="month" :d="day">
<!--    <date-select>-->
      <input class="inp" placeholder="选择日期"/>
    </date-select>
    <p>123456</p>
  </div>
</template>

<script>
import DateSelect from './components/date-select';
export default {
  filters: {
    f1 (v) {
      return v + "....";
    },
    test1 (v) {
      return v + "...fff";
    }
  },
  name: 'App',
  components: {
    DateSelect
  },
  data () {
    return {
      value: "abd",
      isTest: true,
      year: 2019,
      month: 6,
      day: 8
    }
  },
  mounted () {

  },
  methods: {
    test () {
      this.day = 4;
    }
  },
  computed: {

  }
}
</script>

<style lang="css">
html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.app {
  height: 100%;
  width: 100%;
  padding: 32px;
}
*,
*::after,
*::before {
  box-sizing: border-box;
}

/* -------------------- */

.inp {
  height: 64px;
  width: 280px;
  border: 1px solid grey;
  outline: none;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 24px;
  color: #333;
  cursor: pointer;
}
.inp::placeholder {
  color: #333;
}
.inp:focus {
  border: 1px solid #409efe;
}
</style>
