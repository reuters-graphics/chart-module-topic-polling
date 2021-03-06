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

    this.termList = Object.keys(this.allTerms).filter((term) => {
      if (
        term !== 'Total - Unweighted Count' &&
        term !== 'Other' &&
        term !== "Don't know"
      ) {
        return this.allTerms[term][dateIndex];
      }
    });

    this.termList = this.termList.sort((a, b) => {
      const aVal =
        data.demographics['Respondents:AllRespondents'][a][dateIndex];
      const bVal =
        data.demographics['Respondents:AllRespondents'][b][dateIndex];

      return bVal - aVal;
    });

    this.demoList = ['All'];
    Object.keys(data.demographics).forEach((key) => {
      if (key.split(':')[0] === props.selectedDemo) {
        const lookupObject = key.split(':')[0];
        const demo = key.split(':')[1];
        // console.log('demoList', data.demographics, 'key', key);
        if (props.omit.indexOf(demo) < 0) {
          this.demoList.push(demo);
        }
      }
    });

    // console.log('props:', props.translation.en);

    const theMap = {};
    const theData = [];
    // const termLookup = this.demoList;
    // const temp = [];
    // console.log(data.demographics);

    this.demoList.forEach((demo) => {
      if (demo === 'All') {
        return true;
      }

      if (!theMap[demo]) {
        theMap[demo] = [];
      }

      this.termList.forEach((term) => {
        const obj = {
          val:
            data.demographics[`${props.selectedDemo}:${demo}`][term][dateIndex],
          term: term,
        };

        theMap[demo].push(obj);
      });
    });

    Object.keys(theMap).forEach((demo) => {
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

      this.demoList.forEach((demo) => {
        if (demo !== 'All') {
          const valObj = {
            id: demo,
            term: term,
            val:
              data.demographics[`${props.selectedDemo}:${demo}`][term][
                dateIndex
              ],
            rank: theMap[demo].findIndex((d) => d.term == term),
          };

          obj.values.push(valObj);
        }
      });

      theData.push(obj);
    });

    let high, low, mid;
    theData.forEach((data, i) => {
      // console.log('color dom data', data);
      high = 0;
      if (theData[i].values[0].val > 5.0) {
        low = i;
      }
      // low = theData[theData.length - 1].values[0].val;
      mid = (high - low) / 2;

      this.colorDom = [low, high];
      // console.log('color dom data', this.colorDom);
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
      right: 10,
      bottom: 25,
      left: 100,
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
    const height = this.termList.length * 35 - margin.top - margin.bottom;

    const yDom = d3.range(0, this.termList.length);

    const xScale = d3
      .scaleBand()
      .domain(this.demoList)
      .range([0, width])
      .padding(0.4)
      .paddingOuter(0);

    console.log(width);

    const yScale = d3.scaleBand().domain(yDom).range([0, height]).padding(0.1);

    const mouseOverScale = d3.scaleBand().domain(yDom).range([0, height]);

    this.color = d3
      .scaleLinear()
      .domain(this.colorDom)
      .range(['#DDF0EE', '#60A6A4']);

    this.colorOther = d3.scaleLinear().domain([0, 5]).range(['#eee', '#ccc']);

    const xbw = xScale.bandwidth();
    const ybw = yScale.bandwidth();
    // const ybwmo = mouseOverScale.bandwidth();
    const ybwmo = yScale.padding(0).bandwidth();

    const makeLine = d3
      .area()
      .x((d, i) => {
        if (i == 0) {
          return -props.margin.left;
        } else {
          return xScale(d.id) + xbw * d.dir + xbw * 0.5;
        }
      })
      .y0((d) => yScale(d.rank))
      .y1((d) => yScale(d.rank) + ybw);

    const makeLineMouseOver = d3
      .area()
      .x((d, i) => {
        if (i == 0) {
          return -props.margin.left;
        } else {
          return xScale(d.id) + xbw * d.dir + xbw * 0.5;
        }
      })
      .y0((d) => mouseOverScale(d.rank))
      .y1((d) => mouseOverScale(d.rank) + ybwmo);

    const plot = this.selection()
      .appendSelect('svg') // ???? Use appendSelect instead of append for non-data-bound elements!
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .appendSelect('g.plot')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    plot
      .appendSelect('g.axis.x')
      .attr('transform', 'translate(0,0)')
      .call(
        d3.axisTop(xScale).tickFormat((d) => {
          const string = d;
          const newString = props.demographicLookup[props.selectedDemo][string] ?
              props.demographicLookup[props.selectedDemo][string] :
            string;
          return newString;
        })
      )
      .selectAll('.tick text')
      .attr('class', function(d, i) {
        const textClass = i === 0 ? 'val bold' : 'val';
        return textClass;
      });

    const tickValue = plotData.map((d) => d.id);

    // console.log(tickValue);
    // console.log('DATA HERE', plotData);
    plot
      .appendSelect('g.axis.y')
      .call(
        d3.axisLeft(yScale).tickFormat((d) => {
          const string = tickValue[d];
          const newString = props.translation.en[string] ?
              props.translation.en[string] :
            string;
          return newString;
        })
      )
      .selectAll('.tick text')
      .attr('x', -props.margin.left + 4)
      .attr('dy', 3)
      .style('text-anchor', 'start');

    d3.select(container).selectAll('.tick').selectAll('line').remove();

    const termsLayer = plot.appendSelect('g.terms-layer').lower();

    const termGroup = termsLayer
      .selectAll('g.term-group')
      .data(plotData)
      .join('g')
      .attr('class', (d) => `term-group ${slugify(d.id)}`);
      // .on('mouseover', function(e, d) {
      //   plot.selectAll('.term-group').classed('inactive', true);
      //   d3.select(this)
      //     .classed('active', true)
      //     .classed('inactive', false)
      //     .raise();
      // })
      // .on('mouseout', () => {
      //   plot.selectAll('.term-group').classed('inactive', false);
      //   plot.selectAll('.term-group').classed('active', false);
      // });

    const termGroupMouseOver = termsLayer
      .selectAll('g.term-group-mouseover')
      .data(plotData)
      .join('g')
      .attr('class', (d) => 'term-group-mouseover')
      .on('mouseover', function(e, d) {
        plot.selectAll('.term-group').classed('inactive', true);
        d3.select(`.term-group.${slugify(d.id)}`)
          .classed('active', true)
          .classed('inactive', false)
          .raise();
      })
      .on('mouseout', () => {
        plot.selectAll('.term-group').classed('inactive', false);
        plot.selectAll('.term-group').classed('active', false);
      });

    termGroup
      .appendSelect('path')
      .attr('d', (d) => {
        const newArr = [];
        d.values.forEach((v) => {
          [-0.5, 0.5].forEach((dir) => {
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
      .style('fill', (d, i) => {
        if (d.values[0].val > 5.0) {
          return this.color(i);
        } else {
          return this.colorOther(d.values[0].val);
        }
      });

    termGroupMouseOver
      .appendSelect('path')
      .attr('d', (d) => {
        const newArr = [];
        d.values.forEach((v) => {
          [-0.5, 0.5].forEach((dir) => {
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

        return makeLineMouseOver(newArr);
      })
      // .style('fill', 'red')
      .style('opacity', 0);

    termGroup
      .selectAll('text.val')
      .data((d) => d.values)
      .join('text')
      .attr('class', function(d, i) {
        const textClass = i === 0 ? 'val bold' : 'val';
        return textClass;
      })
      .attr('x', (d) => xScale(d.id) + xScale.bandwidth() * 0.5)
      .attr('y', (d) => yScale(d.rank) + yScale.bandwidth() * 0.5 + 4)
      .text((d) => {
        let str = d3.format('.0f')(d.val);
        if (d.val < 1) {
          str = '<1';
        }

        return d.id == 'All' ? `${str}%` : str;
      })
      .style('text-anchor', 'middle');

    termGroup.lower();

    const transition = plot.transition().duration(500);

    return this; // Generally, always return the chart class from draw!
  }
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export default TopicPolling;
