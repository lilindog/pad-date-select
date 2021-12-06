<template>
  <div class="app">
    <h1 @click="test">改变value</h1>
    <h1 @click="test1">改变dateRange</h1>

    <date-select v-model="value" @change="onChange" @input="onInput" :visable="visable" :date-range="dateRange">
      <input class="inp" placeholder="选择日期" :value="value" @click="visable = true"/>
      <template v-slot:button-group >
        <div class="btn-wrap">
          <button @click="visable = false">完成</button>
        </div>
      </template>
    </date-select>
  </div>
</template>

<script>
import DateSelect from './components/date-select';
export default {
  name: 'App',
  components: {
    DateSelect
  },
  data () {
    return {
      value: "",
      dateRange: ["2018-01-01", "2022-12-12"],
      visable: !false
    }
  },
  methods: {
    test () {
      this.value = "2018-08-05";
    },
    test1 () {
      this.dateRange = [ "2019-12-12", "2020-12-12" ];
    },
    onInput (data) {
      console.log("input 事件：");
      console.log(data);
    },
    onChange (data) {
      console.log("change 事件：");
      console.log(data);
    }
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
.btn-wrap {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /*background: #409efe;*/
}
button {
  height: 44px;
  padding: 0 20px;
  box-sizing: border-box;
  border-radius: 5px;
  outline: none;
  border: none;
  line-height: 44px;
  background: none;
  color: #fff;
}
button:active {
  transform: scale(0.95);
}
</style>
