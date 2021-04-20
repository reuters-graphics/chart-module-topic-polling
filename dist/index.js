'use strict';

var d3 = require('d3');
var d3Appendselect = require('d3-appendselect');
var merge = require('lodash/merge');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var merge__default = /*#__PURE__*/_interopDefaultLegacy(merge);

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

d3.selection.prototype.appendSelect = d3Appendselect.appendSelect;
/**
 * Write your chart as a class with a single draw method that draws
 * your chart! This component inherits from a base class you can
 * see and customize in the baseClasses folder.
 */

var TopicPolling = /*#__PURE__*/function () {
  function TopicPolling() {
    _classCallCheck(this, TopicPolling);

    _defineProperty(this, "defaultProps", {
      aspectHeight: 0.7,
      margin: {
        top: 40,
        right: 20,
        bottom: 25,
        left: 70
      },
      fill: 'grey'
    });
  }

  _createClass(TopicPolling, [{
    key: "selection",
    value: function selection(selector) {
      if (!selector) return this._selection;
      this._selection = d3.select(selector);
      return this;
    }
  }, {
    key: "data",
    value: function data(newData) {
      if (!newData) return this._data || this.defaultData;
      this._data = newData;
      return this;
    }
  }, {
    key: "props",
    value: function props(newProps) {
      if (!newProps) return this._props || this.defaultProps;
      this._props = merge__default['default'](this._props || this.defaultProps, newProps);
      return this;
    }
  }, {
    key: "formatData",
    value: function formatData(data, props) {
      var _this = this;

      this.allTerms = data.demographics['Respondents:AllRespondents'];
      var dateIndex = data.dates.indexOf(props.selectedDate);
      this.termList = Object.keys(this.allTerms).filter(function (term) {
        if (term !== 'Total - Unweighted Count' && term !== 'Other' && term !== "Don't know") {
          return _this.allTerms[term][dateIndex];
        }
      });
      this.termList = this.termList.sort(function (a, b) {
        var aVal = data.demographics['Respondents:AllRespondents'][a][dateIndex];
        var bVal = data.demographics['Respondents:AllRespondents'][b][dateIndex];
        return bVal - aVal;
      });
      this.demoList = ['All'];
      Object.keys(data.demographics).forEach(function (key) {
        if (key.split(':')[0] === props.selectedDemo) {
          key.split(':')[0];
          var demo = key.split(':')[1];
          console.log('demoList', data.demographics, 'key', key);

          if (props.omit.indexOf(demo) < 0) {
            _this.demoList.push(demo);
          }
        }
      });
      console.log('props:', props.translation.en);
      var theMap = {};
      var theData = []; // const termLookup = this.demoList;
      // const temp = [];

      console.log(data.demographics);
      this.demoList.forEach(function (demo) {
        if (demo === 'All') {
          return true;
        }

        if (!theMap[demo]) {
          theMap[demo] = [];
        }

        _this.termList.forEach(function (term) {
          var obj = {
            val: data.demographics["".concat(props.selectedDemo, ":").concat(demo)][term][dateIndex],
            term: term
          };
          theMap[demo].push(obj);
        });
      });
      Object.keys(theMap).forEach(function (demo) {
        theMap[demo] = theMap[demo].sort(function (a, b) {
          var aVal = a.val;
          var bVal = b.val;
          return bVal - aVal;
        });
      });
      this.termList.forEach(function (term, i) {
        var obj = {
          id: term,
          values: []
        };
        var AllObj = {
          id: 'All',
          term: term,
          val: _this.allTerms[term][dateIndex],
          rank: i
        };
        obj.values.push(AllObj);

        _this.demoList.forEach(function (demo) {
          if (demo !== 'All') {
            var valObj = {
              id: demo,
              term: term,
              val: data.demographics["".concat(props.selectedDemo, ":").concat(demo)][term][dateIndex],
              rank: theMap[demo].findIndex(function (d) {
                return d.term == term;
              })
            };
            obj.values.push(valObj);
          }
        });

        theData.push(obj);
      });
      var high, low, mid;
      theData.forEach(function (data, i) {
        console.log('color dom data', theData[i].values[0].val);
        high = theData[0].values[0].val; // if (theData[i].values[0].val > 5.0) {
        //   low = theData[i].values[0].val;
        // }

        low = theData[theData.length - 1].values[0].val;
        mid = (high - low) / 2;
        _this.colorDom = [low, mid, high];
      });
      return theData.sort(function (a, b) {
        return d3.descending(a.values[0].val, b.values[0].val);
      });
    }
    /**
     * Default props are the built-in styles your chart comes with
     * that you want to allow a user to customize. Remember, you can
     * pass in complex data here, like default d3 axes or accessor
     * functions that can get properties from your data.
     */

  }, {
    key: "draw",

    /**
     * Write all your code to draw your chart in this function!
     * Remember to use appendSelect!
     */
    value: function draw() {
      var _this2 = this;

      var data = this.data(); // Data passed to your chart

      var props = this.props(); // Props passed to your chart
      // console.log('index data', data);

      var margin = props.margin;
      var container = this.selection().node();

      var _container$getBoundin = container.getBoundingClientRect(),
          containerWidth = _container$getBoundin.width; // Respect the width of your container!


      var plotData = this.formatData(data, props);
      var width = containerWidth - margin.left - margin.right;
      var height = this.termList.length * 30 - margin.top - margin.bottom;
      var yDom = d3.range(0, this.termList.length);
      var xScale = d3.scaleBand().domain(this.demoList).range([0, width]).padding(0.4);
      var yScale = d3.scaleBand().domain(yDom).range([0, height]).padding(0.1);
      d3.scaleLinear().domain([0, 20]).range(['red', 'red']);
      this.color = d3.scaleLinear().domain(this.colorDom).range(['lightyellow', '#fd7e14', '#dc3545']);
      this.colorOther = d3.scaleLinear().domain([0, 5]).range(['#eee', '#aaa']);
      var xbw = xScale.bandwidth();
      var ybw = yScale.bandwidth();
      console.log(xbw, ybw);
      var makeLine = d3.area().x(function (d) {
        return xScale(d.id) + xbw * d.dir + xbw * 0.5;
      }).y0(function (d) {
        return yScale(d.rank);
      }).y1(function (d) {
        return yScale(d.rank) + ybw;
      }); // .attr('x', d => xScale(d.id) - margin.left / this.demoList.length + 1)
      // .attr('y', d => yScale(d.term) - margin.top / 2)

      var plot = this.selection().appendSelect('svg') // 👈 Use appendSelect instead of append for non-data-bound elements!
      .attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).appendSelect('g.plot').attr('transform', "translate(".concat(margin.left, ",").concat(margin.top, ")"));
      plot.appendSelect('g.axis.x').attr('transform', 'translate(0,0)').call(d3.axisTop(xScale).tickFormat(function (d) {
        var string = d;
        var newString = props.demographicLookup[props.selectedDemo][string] ? props.demographicLookup[props.selectedDemo][string] : string;
        return newString;
      })).selectAll('.tick text').attr('class', function (d, i) {
        var textClass = i === 0 ? 'val bold' : 'val';
        return textClass;
      });
      var tickValue = plotData.map(function (d) {
        return d.id;
      }); // console.log(tickValue);
      // console.log('DATA HERE', plotData);

      plot.appendSelect('g.axis.y').call(d3.axisLeft(yScale).tickFormat(function (d) {
        var string = tickValue[d];
        var newString = props.translation.en[string] ? props.translation.en[string] : string;
        return newString;
      })).selectAll('.tick text').attr('x', -props.margin.left).style('text-anchor', 'start'); // console.log(plotData);

      d3.select(container).selectAll('.tick').selectAll('line').remove();
      var termGroup = plot.selectAll('g.term-group').data(plotData).join('g').attr('class', 'term-group'); // .attr('transform', `translate(${margin.left / this.demoList.length},${margin.top / 2})`);

      termGroup.appendSelect('path').attr('d', function (d) {
        var newArr = [];
        d.values.forEach(function (v) {
          [-0.5, 0.5].forEach(function (dir) {
            var obj = {
              rank: v.rank,
              term: v.term,
              val: v.val,
              id: v.id,
              dir: dir
            };
            newArr.push(obj);
          });
        });
        return makeLine(newArr);
      }).style('fill', function (d) {
        if (d.values[0].val > 5.0) {
          return _this2.color(d.values[0].val);
        } else {
          return _this2.colorOther(d.values[0].val);
        }
      }).style('opacity', 0.6);
      termGroup.selectAll('text.val').data(function (d) {
        return d.values;
      }).join('text').attr('class', function (d, i) {
        var textClass = i === 0 ? 'val bold' : 'val';
        return textClass;
      }).attr('x', function (d) {
        return xScale(d.id) + xScale.bandwidth() * 0.5;
      }).attr('y', function (d) {
        return yScale(d.rank) + yScale.bandwidth() * 0.5 + 6;
      }).text(function (d) {
        return d3.format('.1f')(d.val);
      }).style('text-anchor', 'middle').style('opacity', 0.8);
      plot.transition().duration(500);
      return this; // Generally, always return the chart class from draw!
    }
  }]);

  return TopicPolling;
}();

module.exports = TopicPolling;
