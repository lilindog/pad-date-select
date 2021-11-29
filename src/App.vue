<template>
  <div class="app">
    <button @click="test">test</button>
    <date-select :value="date" @change="onChange" :visable="visable">
<!--    <date-select>-->
      <input class="inp" placeholder="选择日期"/>
      <template v-slot:button-group>
        <p>123</p>
      </template>
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
      value: 'abd',
      isTest: true,
      date: '2022-3-31',
      visable: false,
    }
  },
  mounted () {

  },
  methods: {
    test () {
      this.visable = !this.visable;
    },
    onChange (data) {
      console.log(data);
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
