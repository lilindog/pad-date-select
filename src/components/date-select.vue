<!--
可能存在的异常：
* 在切换时候，外部value变动所带来的影响？这个场景应该不多，这里因为时间问题，我就先不去打磨了。
-->
<template>
  <div class="component-dateselect">
    <div ref="slot-wrap">
      <slot></slot>
    </div>
    <div
        class="popup-wrap"
        :class="{ 'popup-wrap_open': isPopupStateToOpen, 'popup-wrap_close': !isPopupStateToOpen }"
        :style="'top:' + (slotHeight + popupMarginTop) + 'px;'"
    >
      <div class="popup-in">
        <div ref="container" class="container">
          <div class="column" ref="column-y">
            <div ref="column-in-y">
              <div class="child" v-for="(item, index) in years" :key="index" :ref="'y-' + item">{{item}}</div>
            </div>
          </div>
          <div class="column" ref="column-m">
            <div ref="column-in-m">
              <div class="child" v-for="(item, index) in months" :key="index" :ref="'m-' + item">{{item}}</div>
            </div>
          </div>
          <div class="column" ref="column-d">
            <div ref="column-in-d">
              <div class="child" v-for="(item, index) in days" :key="index" :ref="'d-' + item">{{item}}</div>
            </div>
          </div>
          <div class="select-line"></div>
        </div>
        <div class="btn-wrap">

        </div>
      </div>
    </div>
  </div>
</template>

<script>

const DEBUG = !true;

const POPUP_STATE = {
  OPEN: "open",
  CLOSE: "close"
};

const EVENTS_MAP = {
  'INPUT': 'input',
  'CHANGE': 'change'
}

const log = (...args) => {
  DEBUG && console.log(...args);
};

const error = (...args) => {
  DEBUG && console.error(...args);
};

export default {
  name: "date-select",
  props: {
    // 以当年为准，上下加多少年的选择范围
    bothYearCount: {
      type: Number,
      default: 10
    },
    // 年月日字符串，如2021-12-12、2021/12/12 间隔都要与props.spaceMark 一致，否则无效
    value: String,
    // 日期间隔符
    spaceMark: {
      type: String,
      default: "-"
    }
  },
  data () {
    return {
      slotHeight: 0,
      popupMarginTop: 10,
      popupState: POPUP_STATE["CLOSE"],
      years: [],
      months: [],
      days: [],
      /**
       * ============= 以下数据不与视图耦合 =============
       */
      columnInY: null,
      columnInM: null,
      columnInD: null,
      columnYEleMT: 0,
      columnMEleMT: 0,
      columnDEleMT: 0,
      isStartTouchY: false,
      isStartTouchM: false,
      isStartTouchD: false,
      oldY: 0,
      oldM: 0,
      oldD: 0,
    }
  },
  computed: {
    isPopupStateToOpen () {
      return this.popupState === POPUP_STATE["OPEN"];
    }
  },
  watch: {
    value: 'handeSelectPosition'
  },
  mounted () {
    this.slotHeight = this.$refs["slot-wrap"].offsetHeight;
    this.popupState = POPUP_STATE["OPEN"];
    this.bindEvents();
    this.generateYM();
    this.handeSelectPosition();
  },
  methods: {
    bindEvents () {
      const columnAndColumnIns = ['y', 'm', 'd'].map(k => {
          const ref = this.$refs["column-" + k];
          const refIn = this["columnIn" + k.toUpperCase()] = this.$refs["column-in-" + k];
          return [ref, refIn];
      });
      columnAndColumnIns.forEach(this.onEvents.bind(this));
    },
    onEvents ([ column, columnIn ], index) {
      let start = 0;
      let startTime = 0;
      let prev = 0;
      let lastMoveTime = 0;
      const MTK = 'column' + ['Y', 'M', 'D'][index] + 'EleMT';
      const SK = ['years', 'months', 'days'][index];
      const ISTK = 'isStartTouch' + ['Y', 'M', 'D'][index];
      const onTouchstartOrMounsedown = e => {
        this[ISTK] = true;
        const y = this.getYFromEvent(e);
        start = prev = y;
        startTime = new Date().getTime();
        this[MTK] = parseFloat(window.getComputedStyle(columnIn).marginTop);
      };
      const onTouchmoveOrMousemove = e => {
        let y = this.getYFromEvent(e);
        lastMoveTime = new Date().getTime();
        let space = y - prev;
        prev = y;
        this[MTK] += space;
        columnIn.style.marginTop = this[MTK] + "px";
      };
      const onTouchendOrMouseup = e => {
        const spaceLastMoveTime = new Date().getTime() - lastMoveTime;
        this[ISTK] = false;
        let y = this.getYFromEvent(e);
        let spaceTime = new Date().getTime() - startTime;
        let v = (y - start) / spaceTime;
        let space = v * (Math.abs(y - start));
        // let eleMT = parseFloat(window.getComputedStyle(columnIn).marginTop);
        const eleMT =this[MTK];
        if (space + eleMT > 0) {
          space = 0 - eleMT;
        } else if (space + eleMT <= -((this[SK].length - 3) * 64)) {
          space = -((this[SK].length - 3) * 64) - eleMT;
        }
        // 这里要区分快速滑动后按住不放的情况
        // 哪怕之前的速度再快，此刻也不需要惯性
        if (spaceLastMoveTime > 20) {
          scrollFinished();
        } else {
          this.animationToPosition(MTK, ISTK, columnIn, space, 5, scrollFinished);
        }
      };
      // 善后；处理整切、慢拖溢出回弹
      const scrollFinished = () => {
        let space = 0;
        let eleMT = this[MTK];
        if (eleMT < -(this[SK].length - 3) * 64) {
          // log("a");
          space = Math.abs(eleMT) - ((this[SK].length - 3) * 64);
        } else if (eleMT > 0) {
          // log("b");
          space = 0 - eleMT;
        } else {
          // log("c");
          space = -(eleMT - Math.round(eleMT / 64) * 64);
        }
        if (this[ISTK]) return;
        this.animationToPosition(MTK, ISTK, columnIn, space, 5, () => {
          const step = Math.floor(Math.ceil(Math.abs(this[MTK])) / 64);

          // 处理年月切换时候的天数处理，以及最大选择切换问题
          const handleDays = (y, m, cb = () => {}) => {
            const oldDaysCount = this.days.length - 2;
            this.generateD(y, m);
            log('旧选择天数', '现月的天数');
            log(this.oldD, this.days.length - 2);
            if (this.oldD > this.days.length - 2 && this.days.length - 2 !== oldDaysCount) {
              error('fuck');
              const space = (this.oldD - (this.days.length - 2)) * 64;
              this.oldD = this.days.length - 2;
              log(space);
              this.animationToPosition('columnDEleMT', 'isStartTouchD', this.columnInD, space, 5, cb);
              return true;
            } else {
              return false;
            }
          }

          /**
           * ！！！
           * 切换年和月的时候，要注意天数的变化
           * 若上次上次选择处于最后一天，此次变化后天数少于他，则需要变动oldD，且不需要出发事件
           * 使用动画的方式将其最后一天挪到本月的最后一天
           */
          [
            () => {
              const y = this.years[step + 2];
              this.oldY = y;
              log('选择年：' + y);
              if (
                  handleDays(y, this.oldM, this.triggerEvent.bind(this, y)) === false
              ) {
                this.triggerEvent(y);
              }
            },
            () => {
              const m = this.months[step + 2];
              this.oldM = m;
              log('选择月：' + m);
              if (
                  handleDays(this.oldY, m, this.triggerEvent.bind(this, null, m)) === false
              ) {
                this.triggerEvent(null, m);
              }
            },
            () => {
              const d = this.days[step + 2];
              this.oldD = d;
              log('选择日：' + d);
              this.triggerEvent(null, null, d);
            }
          ][index].call(this);
        });
      };

      const onPcMouseup = e => {
        onTouchendOrMouseup(e);
        column.onmousemove = null;
        document.removeEventListener("mouseup", onPcMouseup);
      };

      /**
       * 移动端事件
       */
      column.addEventListener("touchstart", onTouchstartOrMounsedown);
      column.addEventListener("touchmove", onTouchmoveOrMousemove);
      column.addEventListener("touchend", onTouchendOrMouseup);

      /**
       * pc端事件
       */
      column.onmousedown = e => {
        onTouchstartOrMounsedown(e);
        column.onmousemove = onTouchmoveOrMousemove;
        document.addEventListener("mouseup", onPcMouseup);
      };
      column.onmouseup = e => {
        e.stopPropagation();
        onTouchendOrMouseup(e);
        column.onmousemove = null;
      };
    },

    triggerEvent (y, m, d) {
      y = y || this.oldY;
      m = m || this.oldM;
      d = d || this.oldD;
      log("出发选择事件：");
      log(y, m, d);
      this.$emit(EVENTS_MAP['CHANGE'], { y, m, d });
      this.$emit(EVENTS_MAP['INPUT'], [y, m, d].join(this.spaceMark));
    },

    getYFromEvent (e) {
      return e.screenY || e?.changedTouches[0]?.screenY;
    },

    animationToPosition (MTK, ISTK, ele, space = 0, _ = 5, cb = () => {}) {
      requestAnimationFrame(() => {
        let move = space / _;
        space -= move;
        this[MTK] += move;
        ele.style.marginTop = this[MTK] + "px";
        if (Math.abs(space) * 10 | 0 !== 0 && !this[ISTK]) this.animationToPosition(MTK, ISTK, ele, space, _, cb);
        else cb();
      });
    },

    generateYM () {
      const years = Array(this.bothYearCount * 2 + 1)
          .fill(null)
          .reduce((t, _, index) => (t.push(new Date().getFullYear() - this.bothYearCount + index), t), []);
      const months = Array(12).fill(null).reduce((t, _, index) => (t.push(index + 1 < 10 ? '0' + (index + 1): index + 1), t), []);
      years.unshift(null, null);
      months.unshift(null, null);
      this.years = years;
      this.months = months;
    },
    generateD (y, m) {
      const dayCount = new Date(y, m, 0).getDate();
      log('生成天数：');
      log(dayCount);
      const days = new Array(dayCount).fill(null).reduce((t, c, i) => (t.push(i + 1 < 10 ? '0' + (i + 1) : i + 1), t), []);
      days.unshift(null, null);
      this.days = days;
    },
    async handeSelectPosition () {
      if (this.value) {
        /**
         * ！！！
         * 如果props.value不合法，或props.spaceMark不正确，
         * 都将导致时间无效或者不正确
         */
        let [ y, m, d ] = this.value.split(this.spaceMark);
        await new Promise(r => {
          this.generateD(y, m);
          this.$nextTick(r);
        });
        const dt = new Date(y, m - 1, d);
        y = dt.getFullYear();
        m = dt.getMonth() + 1;
        d = dt.getDate();
        if (this.y !== this.oldY) {
          let spaceY;
          if (!this.oldY) {
            log("> y1");
            spaceY = ( (new Date().getFullYear() - this.bothYearCount) - y ) * 64;
          } else {
            log("> y2");
            log(this.oldY, y);
            spaceY = ( (y > this.oldY ? this.oldY - y : this.oldY - y) ) * 64;
          }
          this.oldY = y;
          this.animationToPosition('columnYEleMT', 'isStartTouchY', this.columnInY, spaceY);
        }
        if (this.m !== this.oldM) {
          let spaceM;
          if (!this.oldM) {
            log("> m1");
            spaceM = -(m - 1) * 64; // 减去1是因为1月顶边距为0, 如果不减1，那么1*64就不是1月份的位置了
          } else {
            log("> m2");
            spaceM = (this.oldM - m) * 64;
          }
          this.oldM = m;
          this.animationToPosition('columnMEleMT', 'isStartTouchM', this.columnInM, spaceM);
        }
        if (this.d !== this.oldD) {
          let spaceD;
          if (!this.oldD) {
            log("> d1");
            spaceD = -(d - 1) * 64; // 减去1原因与上面的月份处理相同
          } else {
            log("> d2");
            spaceD = (this.oldD - d) * 64;
          }
          this.oldD = d;
          this.animationToPosition('columnDEleMT', 'isStartTouchD', this.columnInD, spaceD);
        }
      } else {
        console.log(">> 没有props.value,显示当前日期");
        this.toTodaySelected();
      }
    },
    async toTodaySelected () {
      const dt = new Date;
      const y = dt.getFullYear();
      const m = dt.getMonth() + 1;
      const d = dt.getDate();
      await new Promise(r => {
        this.generateD(y, m);
        this.$nextTick(r);
      });
      /**
       * 这里可以不用动画，直接设置为当前日期
       */
      this.animationToPosition('columnYEleMT', 'isStartTouchY', this.columnInY, 0 - this.bothYearCount * 64, 20);
      this.animationToPosition('columnMEleMT', 'isStartTouchM', this.columnInM, -((m - 1) * 64), 20);
      this.animationToPosition('columnDEleMT', 'isStartTouchD', this.columnInD, -((d - 1) * 64), 20);
      this.oldY = y;
      this.oldM = m;
      this.oldD = d;
    },
    togglePopup () {

    }
  }
}
</script>

<style scoped>
.component-dateselect {
  --popup-height: calc(6 * 64px);
  --popup-btnwrap-height: 64px;
  --select-line-color: rgba(42,178,255,.8);

  background: red;
  display: inline-block;
  position: relative;
}
.component-dateselect .popup-wrap {
  box-shadow: 0px 0px 10px rgba(0,0,0,0.5);
  position: absolute;
  bottom: 20px;
  left: 0;
  background: #0d357d;
  width: 500px;
  border-radius: 10px;
  overflow: hidden;
  transirion-property: height, opacity;
  transition-duration: .3s;
  transition-time-function: linear;
}
.component-dateselect .popup-wrap_open {
  height: var(--popup-height);
  opacity: 1;
}
.component-dateselect .popup-wrap_close {
  height: 0;
  opacity: 0;
}
.component-dateselect .popup-in {
  height: 100%;
}
.component-dateselect .container {
  /*background: green;*/
  display: flex;
  position: relative;
  overflow: hidden;
}
.component-dateselect .btn-wrap {
  height: var(--popup-btnwrap-height);
  /*background: #409efe;*/
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.component-dateselect .column {
  width: 33.3%;
  height: calc(5 * 64px);
  /*background: grey;*/
  /*border-right: 1px solid rgba(42,178,255,.8);*/
}
.component-dateselect .column:nth-child(3) {
  border-right: none;
}
.component-dateselect .select-line {
  height: 64px;
  width: 100%;
  position: absolute;
  border-top: 1px solid var(--select-line-color);
  border-bottom: 1px solid var(--select-line-color);
  /*box-shadow: 0px 0px 5px rgba(0,0,0,0.3);*/
  top: 50%; left: 0;
  transform: translate(0, -50%);
  pointer-events: none;
}
.component-dateselect .child {
  height: 64px;
  line-height: 64px;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  user-select: none;
  color: #fff;
}
</style>
