<!--
以下2点暂定出现的几率不高，若存在后续我再改动：

* 外部props.dateRange变化时，处于手动滑动或者惯性未结束时的处理。
* 外部props.value变化时，当前处于手动滑动或者惯性动画未结束的处理。
-->
<template>
  <div class="component-dateselect">
    <div ref="slot-wrap">
      <slot></slot>
    </div>
    <div
        class="popup-wrap"
        :class="{ 'popup-wrap_open': visable, 'popup-wrap_close': !visable }"
        :style="'top:' + (slotHeight + popupMarginTop) + 'px;'"
    >
      <div class="popup-in">
        <div ref="container" class="container">
          <div class="column" ref="column-y">
            <div ref="column-in-y">
              <div class="child" v-for="(item, index) in ranges[0]" :key="index" :ref="'y-' + item">{{item}}</div>
            </div>
          </div>
          <div class="column" ref="column-m">
            <div ref="column-in-m">
              <div class="child" v-for="(item, index) in ranges[1]" :key="index" :ref="'m-' + item">{{item}}</div>
            </div>
          </div>
          <div class="column" ref="column-d">
            <div ref="column-in-d">
              <div class="child" v-for="(item, index) in ranges[2]" :key="index" :ref="'d-' + item">{{item}}</div>
            </div>
          </div>
          <div class="select-line"></div>
        </div>
        <div class="btn-wrap">
          <slot name="button-group"></slot>
        </div>
      </div>
    </div>
  </div>
</template>
<script>

const log = (...args) => {
  DEBUG && console.log(...args);
};
const error = (...args) => {
  DEBUG && console.error(...args);
};

const DEBUG = !true;
const HEIGHT = 64;
const POPUP_STATE = {
  OPEN: "open",
  CLOSE: "close"
};
const EVENTS_MAP = {
  'INPUT': 'input',
  'CHANGE': 'change'
}
function generateRangeArray (count = 0, start = 0) {
  return Array(count).fill(null).map((...[, index]) => start + index);
}

export default {
  name: "date-select",
  props: {
    // 日期范围，默认上下10年,
    // !!! 起止日期间隔需要正确传递，包括但不限于日期正确、日期字符串格式正确、截止日期不小于起止日期。
    // 因为没有针对日期范围参数做防呆处理，极容易出现未知异常
    dateRange: {
      type: Array,
      default: () => [
          `${new Date().getFullYear() - 10}-01-01`,
          `${new Date().getFullYear() + 10}-12-01`,
      ]
    },
    // 年月日字符串，如2021-12-12、2021/12/12 间隔都要与props.spaceMark 一致，否则无效
    value: String,
    // 日期间隔符
    spaceMark: {
      type: String,
      default: "-"
    },
    // 展示与否
    visable: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      slotHeight: 0,
      popupMarginTop: 10,
      ranges: [ [], [], [] ],

      // ============= 以下数据不与视图耦合 =============
      y: 0,
      m: 0,
      d: 0,
      isTouhes: [ false, false, false ],
      starts: [ 0, 0, 0 ],
      prevs: [ 0, 0, 0 ],
      startTimes: [ 0, 0, 0 ],
      lastMoveTimes: [ 0, 0, 0 ],
      eles: [ null, null, null ],
      tops: [ 0, 0, 0 ],
      limitStart: [ 0, 0, 0 ],
      limitEnd: [ 0, 0, 0 ]
    }
  },
  computed: {
    isPopupStateToOpen () {
      return this.popupState === POPUP_STATE["OPEN"];
    }
  },
  watch: {
    value: function () {
      const y = this.y, m = this.m, d = this.d;
      this.generateDefaultDate();
      if (y !== this.y || m !== this.m || d !== this.d) {
        this.moveToCurrentDate();
      }
    },
    dateRange: "init"
  },
  mounted () {
    this.slotHeight = this.$refs["slot-wrap"].offsetHeight;
    this.eles = [
      this.$refs['column-in-y'],
      this.$refs['column-in-m'],
      this.$refs['column-in-d'],
    ];
    this.eles.forEach((item, index) => {

      // mobile
      [ 'start', 'move', 'end' ].forEach(evt => {
        item[
            {
              'start': 'ontouchstart',
              'move': 'ontouchmove',
              'end': 'ontouchend'
            }[evt]
        ] = this[evt + 'Factory'](index);
      });

      // pc
      const mousedown = this.startFactory(index);
      const mousemove = this.moveFactory(index);
      const mouseup = this.endFactory(index);
      const documentMouseUp = e => {
        mouseup(e);
        item.onmousemove = null;
        document.removeEventListener('mouseup', documentMouseUp);
      };
      item.onmousedown = e => {
        mousedown(e);
        item.onmousemove = mousemove;
        document.addEventListener('mouseup', documentMouseUp);
      };
      item.onmouseup = e => {
        e.stopPropagation();
        item.onmousemove = null;
        mouseup(e);
        document.removeEventListener('mouseup', documentMouseUp);
      };
    });

    this.init();
  },
  methods: {

    init () {
      this.generateDefaultDate();
      this.generateDefaultRanges();
      this.moveToCurrentDate();
    },

    generateDefaultDate () {
      let [ y, m, d ] = this.value.split(this.spaceMark).map(i => Number(i));
      if (!y || !m || !d) {
        y = new Date().getFullYear();
        m = new Date().getMonth() + 1;
        d = new Date().getDate();
      }
      this.y = y;
      this.m = m;
      this.d = d;
    },

    generateDefaultRanges () {
      const LS = this.limitStart = this.dateRange[0].split("-").map(i => Number(i));
      const LE = this.limitEnd = this.dateRange[1].split("-").map(i => Number(i));

      const years = Array(LE[0] - LS[0] + 1).fill(null).map((...[, i]) => LS[0] + i);
      years.unshift(null, null);
      this.ranges = [ years, this.generateMonthRange(), this.generateDayRange() ];
    },

    generateMonthRange () {
      const Y = this.y;
      const LS = this.limitStart;
      const LE = this.limitEnd;
      let months = [];
      if (Y <= LS[0]) {
        if (LS[0] == LE[0]) months = generateRangeArray(LE[1] - LS[1] + 1, LS[1]);
        else months = generateRangeArray(12 - LS[1] + 1, LS[1]);
      } else if (Y >= LE[0]) {
        months = generateRangeArray(LE[1], 1);
      } else {
        months = generateRangeArray(12, 1);
      }
      error("months =====>");
      log(months);

      months.unshift(null, null);
      return months;
    },

    generateDayRange () {
      const Y = this.y;
      const M = this.m;
      const LS = this.limitStart;
      const LE = this.limitEnd;
      let days = [];
      if (Y <= LS[0] || (Y <= LS[0] && M <= LS[1]) ) {
        log("days: ", 1)
        if (LS[0] === LE[0] && LS[1] === LE[1]) {
          days = generateRangeArray(LE[2] - LS[2] + 1, LS[2]);
        } else {
          const dateCount = new Date(LS[0], LS[1], 0).getDate();
          days = generateRangeArray(dateCount - LS[2] + 1, LS[2]);
        }
      } else if (Y >= LE[0] || ( Y >= LE[0] && M >= LE[1]) ) {
        log("days: ", 2)
        days = generateRangeArray(LE[2], 1);
      } else {
        const dateCount = new Date(Y, M, 0).getDate();
        days = generateRangeArray(dateCount, 1);
      }
      error("days =====>");
      log(days);

      days.unshift(null, null);
      return days;
    },

    moveToCurrentDate () {
      const Y = this.y;
      const M = this.m;
      const D = this.d;
      const LS = this.limitStart;
      const LE = this.limitEnd;
      const RGS = this.ranges;
      let y, m, d;

      y = Y < LS[0] ? LS[0] : Y > LE[0] ? LE[0] : Y;
      this.moveToPosition(0, -((RGS[0].indexOf(y) - 2) * HEIGHT));

      this.ranges = [ RGS[0], this.generateMonthRange(), RGS[2] ];
      // 可以对比时间戳，优化时在考虑
      if (Y > LE[0] || (Y > LE[0] && M > LE[1]) ) {
        m = RGS[1][RGS[1].length - 1];
      } else if (Y < LS[0] || (Y < LS[0] && M < LS[1]) ) {
        m = RGS[1][2];
      } else {
        m = M;
      }
      this.moveToPosition(1, -((RGS[1].indexOf(m) - 2) * HEIGHT) );

      this.ranges = [ RGS[0], RGS[1], this.generateDayRange() ];
      // 可以对比时间戳，优化时在考虑
      if (Y > LE[0] || (Y > LE[0] && M > LE[1]) || (Y > LE[0] && M > LE[1] &&  D > LE[2]) ) {
        d = RGS[2][RGS[2].length - 1];
      } else if (Y < LS[0] || (Y < LS[0] && M < LS[1]) || (Y < LS[0] && M < LS[1] &&  D < LS[2]) ) {
        d = RGS[2][2];
      } else {
        d = D;
      }

      this.moveToPosition(2, -((RGS[2].indexOf(d) - 2) * HEIGHT) );
    },

    startFactory (index = -1) {
      return e => {
        this.isTouhes[index] = true;
        this.startTimes[index] = new Date().getTime();
        this.prevs[index] = this.starts[index] = this.getYFromEvent(e);
      }
    },

    moveFactory (index = -1) {
      return e => {
        let
            y = this.getYFromEvent(e),
            space = y - this.prevs[index];
        this.prevs[index] = y;
        this.lastMoveTimes[index] = new Date().getTime();
        this.tops[index] += space;
        this.eles[index].style.marginTop = this.tops[index] + 'px';
      }
    },

    endFactory (index = -1) {
      return () => {
        this.isTouhes[index] = false;
        const
            moveSpace = this.prevs[index] - this.starts[index],
            moveTime = this.lastMoveTimes[index] - this.startTimes[index],
            space = Math.abs(moveSpace) / moveTime * moveSpace;
        let position = this.tops[index] + space;
        position = (position / HEIGHT | 0) * HEIGHT;
        if (position > 0) position = 0;
        // 这里先按元素的高度来计算最大上滑动值，也可以按对应元素child数量来计算更科学
        else if (position < -(this.eles[index].offsetHeight - 3 * HEIGHT)) position = -(this.eles[index].offsetHeight - (HEIGHT * 3));
        // 这里要区分快速滑动后按住不放的情况
        // 若按住不放哪怕之前的速度再快，此刻也不需要惯性
        if (moveTime > 200) {
          // 直接处理整切, 包括两端溢出
          this.handleCut(index, this.changeSelect.bind(this, index));
        } else {
          this.animationMoveToPosition(index, position, this.changeSelect.bind(this, index));
        }
      }
    },

    changeSelect (index = 0) {
      const RGS = this.ranges;
      const RG = RGS[index];
      const TOP = this.tops[index];
      const IDX = Math.abs(Math.round(TOP / HEIGHT)) + 2;
      const setRange = (index = -1, range = []) => {
        this.$set(this.ranges, index, range);
      }
      [
        () => {
          this.y = RG[IDX];

          setRange(1, this.generateMonthRange());
          this.moveToPosition(1, 0);
          this.m = RGS[1][2];

          setRange(2, this.generateDayRange());
          this.moveToPosition(2, 0);
          this.d = RGS[2][2];
        },
        () => {
          this.m = RG[IDX];
          setRange(2, this.generateDayRange());
          this.moveToPosition(2, 0);
          this.d = RGS[2][2];
        },
        () => {
          this.d = RG[IDX];
        }
      ][index].call(this);
      this.triggerEvent();
    },

    handleCut (index = -1, cb) {
      let position = this.tops[index];
      const min = -(Number(this.eles[index].offsetHeight) - HEIGHT * 3);
      if (position > 0) position = 0;
      else if (position < min) position = min;
      else position = Math.round(position / HEIGHT) * HEIGHT;
      this.animationMoveToPosition(index, position, cb);
    },

    triggerEvent () {
      const data = ["y", "m", "d"].reduce((t, k) => {
        t[k] = this[k] < 10 ? "0" + this[k] : String(this[k]);
        return t;
      }, {});
      this.$emit(EVENTS_MAP['CHANGE'], data);
      this.$emit(EVENTS_MAP['INPUT'], Reflect.ownKeys(data).map(k => data[k]).join(this.spaceMark));
    },

    getYFromEvent (e) {
      return e.screenY || e?.changedTouches[0]?.screenY;
    },

    moveToPosition (eleIndex = -1, position = 0) {
      this.tops[eleIndex] = position;
      this.eles[eleIndex].style.marginTop = this.tops[eleIndex] + "px";
    },

    animationMoveToPosition (
        eleIndex = -1,
        position = 0,
        cb,
        v = 5
    ) {
      if (position > 0) throw new RangeError('position 不能大于0！');
      const getTop = () => {
        return this.tops[eleIndex] = this.tops[eleIndex] ?? Number(getComputedStyle(this.eles[eleIndex]).marginTop ?? 0);
      };
      const addTop = top => {
        this.tops[eleIndex]  = getTop() + top;
        this.eles[eleIndex].style.marginTop = getTop() + 'px';
      }
      let space = position - getTop();
      let move;
      const animation = () => {
        if (this.isTouhes[eleIndex]) return;
        requestAnimationFrame(() => {
          if (space.toFixed(1) == 0) {
            typeof cb === "function" && cb();
            return;
          }
          move = space / v;
          if (Math.abs(space) <= 1) move = space;
          space -= move;
          addTop(move);
          animation();
        });
      };
      animation();
    }
  }
}
</script>

<style scoped>
.component-dateselect {
  --popup-height: calc(6 * 64px);
  --popup-btnwrap-height: 64px;
  --select-line-color: rgba(42,178,255,.8);

  /*background: red;*/
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
