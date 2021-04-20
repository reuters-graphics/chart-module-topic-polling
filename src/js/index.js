import * as d3 from 'd3';

import { appendSelect } from 'd3-appendselect';
import merge from 'lodash/merge';

d3.selection.prototype.appendSelect = appendSelect;

/**
 * Write your chart as a class with a single draw method that draws
 * your chart! This component inherits from a base class you can
 * see and customize in the baseClasses folder.
 */
class TopicPolling {
  selection(selector) {
    if (!selector) return this._selection;
    this._selection = d3.select(selector);
    return this;
  }

  data(newData) {
    if (!newData) return this._data || this.defaultData;
    this._data = newData;
    return this;
  }

  props(newProps) {
    if (!newProps) return this._props || this.defaultProps;
    this._props = merge(this._props || this.defaultProps, newProps);
    return this;
  }

  formatData(data, props) {
    this.allTerms = data.demographics['Respondents:AllRespondents'];
    const dateIndex = data.dates.indexOf(props.selectedDate);

    this.termList = Object.keys(this.allTerms).filter(term => {
      if (term !== 'Total - Unweighted Count' && term !== 'Other' && term !== "Don't know") {
        return this.allTerms[term][dateIndex];
      }
    });

    this.termList = this.termList.sort((a, b) => {
      const aVal = data.demographics['Respondents:AllRespondents'][a][dateIndex];
      const bVal = data.demographics['Respondents:AllRespondents'][b][dateIndex];

      return bVal - aVal;
    });

    this.demoList = ['All'];
    Object.keys(data.demographics).forEach(key => {
      if (key.split(':')[0] === props.selectedDemo) {
        const lookupObject = key.split(':')[0];
        const demo = key.split(':')[1];
        console.log('demoList', data.demographics, 'key', key);
        if (props.omit.indexOf(demo) < 0) {
          this.demoList.push(demo);
        }
      }
    });

    console.log('props', props.translation.en);

    const theMap = {};
    const theData = [];
    // const termLookup = this.demoList;
    // const temp = [];
    console.log(data.demographics);

    this.demoList.forEach(demo => {
      if (demo === 'All') {
        return true;
      }

      if (!theMap[demo]) {
        theMap[demo] = [];
      }

      this.termList.forEach(term => {
        const obj = {
          val: data.demographics[`${props.selectedDemo}:${demo}`][term][dateIndex],
          term: term,
        };

        theMap[demo].push(obj);
      });
    });

    Object.keys(theMap).forEach(demo => {
      theMap[demo] = theMap[demo].sort((a, b) => {
        const aVal = a.val;
        const bVal = b.val;
        return bVal - aVal;
      });
    });

    this.termList.forEach((term, i) => {
      const obj = {
        id: term,
        values: [],
      };

      const AllObj = {
        id: 'All',
        term: term,
        val: this.allTerms[term][dateIndex],
        rank: i,
      };

      obj.values.push(AllObj);

      this.demoList.forEach(demo => {
        if (demo !== 'All') {
          const valObj = {
            id: demo,
            term: term,
            val: data.demographics[`${props.selectedDemo}:${demo}`][term][dateIndex],
            rank: theMap[demo].findIndex(d => d.term == term),
          };

          obj.values.push(valObj);
        }
      });

      theData.push(obj);
    });

    let high, low, mid;
    theData.forEach((data, i) => {
      console.log('color dom data', theData[i].values[0].val);
      high = theData[0].values[0].val;
      // if (theData[i].values[0].val > 5.0) {
      //   low = theData[i].values[0].val;
      // }
      low = theData[theData.length - 1].values[0].val;
      mid = (high - low) / 2;

      this.colorDom = [low, mid, high];
    });

    return theData.sort((a, b) =>
      d3.descending(a.values[0].val, b.values[0].val)
    );
  }

  /**
   * Default props are the built-in styles your chart comes with
   * that you want to allow a user to customize. Remember, you can
   * pass in complex data here, like default d3 axes or accessor
   * functions that can get properties from your data.
   */
  defaultProps = {
    aspectHeight: 0.7,
    margin: {
      top: 40,
      right: 20,
      bottom: 25,
      left: 70,
    },
    fill: 'grey',
  };

  /**
   * Write all your code to draw your chart in this function!
   * Remember to use appendSelect!
   */
  draw() {
    const data = this.data(); // Data passed to your chart
    const props = this.props(); // Props passed to your chart

    // console.log('index data', data);
    const { margin } = props;

    const container = this.selection().node();
    const { width: containerWidth } = container.getBoundingClientRect(); // Respect the width of your container!

    const plotData = this.formatData(data, props);

    const width = containerWidth - margin.left - margin.right;
    const height = (this.termList.length * 30) - margin.top - margin.bottom;

    const yDom = d3.range(0, this.termList.length);

    const xScale = d3.scaleBand()
      .domain(this.demoList)
      .range([0, width])
      .padding(0.4);

    const yScale = d3.scaleBand()
      .domain(yDom)
      .range([0, height])
      .padding(0.1);

    const valueScale = d3.scaleLinear()
      .domain([0, 20])
      .range(['red', 'red']);

    this.color = d3.scaleLinear()
      .domain(this.colorDom)
      .range(['lightyellow', '#fd7e14', '#dc3545']);

    this.colorOther = d3.scaleLinear()
      .domain([0, 5])
      .range(['#eee', '#aaa']);

    const xbw = xScale.bandwidth();
    const ybw = yScale.bandwidth();

    console.log(xbw, ybw);

    const makeLine = d3.area()
      .x(d => {
        return xScale(d.id) + (xbw * d.dir) + (xbw * 0.5);
      })
      .y0(d => yScale(d.rank))
      .y1(d => yScale(d.rank) + ybw);

    // .attr('x', d => xScale(d.id) - margin.left / this.demoList.length + 1)
    // .attr('y', d => yScale(d.term) - margin.top / 2)

    const plot = this.selection()
      .appendSelect('svg') // 👈 Use appendSelect instead of append for non-data-bound elements!
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .appendSelect('g.plot')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    plot
      .appendSelect('g.axis.x')
      .attr('transform', 'translate(0,0)')
      .call(d3.axisTop(xScale).tickFormat(d => {
        const string = d;
        const newString = props.demographicLookup[props.selectedDemo][string] ? props.demographicLookup[props.selectedDemo][string] : string;
        return newString;
      }))
      .selectAll('.tick text')
      .attr('class', function(d, i) {
        const textClass = i === 0 ? 'val bold' : 'val';
        return textClass;
      });

    const tickValue = plotData.map(d => d.id);

    // console.log(tickValue);
    // console.log('DATA HERE', plotData);
    plot
      .appendSelect('g.axis.y')
      .call(d3.axisLeft(yScale).tickFormat(d => {
        const string = tickValue[d];
        const newString = props.translation.en[string] ? props.translation.en[string] : string;
        return newString;
      }))
      .selectAll('.tick text')
      .attr('x', -props.margin.left)
      .style('text-anchor', 'start');

    // console.log(plotData);
    d3.select(container).selectAll('.tick').selectAll('line').remove();

    const termGroup = plot.selectAll('g.term-group')
      .data(plotData)
      .join('g')
      .attr('class', 'term-group');
      // .attr('transform', `translate(${margin.left / this.demoList.length},${margin.top / 2})`);

    termGroup.appendSelect('path')
      .attr('d', d => {
        const newArr = [];
        d.values.forEach(v => {
          [-0.5, 0.5].forEach(dir => {
            const obj = {
              rank: v.rank,
              term: v.term,
              val: v.val,
              id: v.id,
              dir: dir,
            };

            newArr.push(obj);
          });
        });

        return makeLine(newArr);
      })
      .style('fill', d => {
        if (d.values[0].val > 5.0) { return this.color(d.values[0].val); } else { return this.colorOther(d.values[0].val); };
      })
      .style('opacity', 0.60);

    termGroup.selectAll('text.val')
      .data(d => d.values)
      .join('text')
      .attr('class', function(d, i) {
        const textClass = i === 0 ? 'val bold' : 'val';
        return textClass;
      })
      .attr('x', d => xScale(d.id) + (xScale.bandwidth() * 0.5))
      .attr('y', d => yScale(d.rank) + (yScale.bandwidth() * 0.5) + 6)
      .text(d => d3.format('.1f')(d.val))
      .style('text-anchor', 'middle')
      .style('opacity', 0.80);

    const transition = plot.transition().duration(500);

    return this; // Generally, always return the chart class from draw!
  }
}

export default TopicPolling;
