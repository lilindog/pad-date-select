<template>
  <div class="app">
    <date-select v-model="value" @change="onChange" :visable="visable">
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
      visable: false
    }
  },
  methods: {
    onChange (data) {
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
