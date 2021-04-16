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
    // {
    //   id: 'Economy',
    //   values: [
    //     {
    //       id: 'All', //xSclale variable
    //       val: 17.8, //display variable
    //       rank: 1 //yScale variable
    //     }

    //   ]
    // }

    this.allTerms = data.demographics['Respondents:AllRespondents'];
    const dateIndex = data.dates.indexOf(props.selectedDate);

    this.termList = Object.keys(this.allTerms).filter(term => {
      if (term !== 'Total - Unweighted Count') {
        return this.allTerms[term][dateIndex];
      }
    });

    this.termList = this.termList.sort((a, b) => {
      const aVal = data.demographics['Respondents:AllRespondents'][a][dateIndex];
      const bVal = data.demographics['Respondents:AllRespondents'][b][dateIndex];

      return aVal - bVal;
    });

    this.demoList = ['All'];
    Object.keys(data.demographics).forEach(key => {
      if (key.split(':')[0] === props.selectedDemo) {
        const demo = key.split(':')[1];
        this.demoList.push(demo);
      }
    });

    // console.log('demolist', this.demoList);

    const theMap = {};
    const theData = [];

    console.log(data.demographics);

    this.termList.forEach(term => {
      if (!theMap[term]) {
        theMap[term] = {};
      }

      this.demoList.forEach(demo => {
        if (demo == 'All') {
          return true;
        }

        theMap[term][demo] = data.demographics[`${props.selectedDemo}:${demo}`][term][dateIndex];
      });
    });

    console.log(theMap);

    this.termList.forEach(term => {
      const obj = {
        id: term,
        values: [],
      };

      const AllObj = {
        id: 'All',
        term: term,
        val: this.allTerms[term][dateIndex],
      };

      obj.values.push(AllObj);

      this.demoList.forEach(demo => {
        if (demo !== 'All') {
          const valObj = {
            id: demo,
            term: term,
            val: data.demographics[`${props.selectedDemo}:${demo}`][term][dateIndex],
          };

          obj.values.push(valObj);
        }
      });

      theData.push(obj);
    });
    // console.log('thedata', theData);

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
      left: 200,
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

    const xScale = d3.scaleBand()
      .domain(this.demoList)
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(this.termList)
      .range([height, 0]);

    const valueScale = d3.scaleLinear()
      .domain([0, 20])
      .range(['red', 'red']);

    const makeLine = d3.line()
      .x(d => xScale(d.id))
      .y(d => yScale(d.term));

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
      .call(d3.axisTop(xScale))
      .selectAll('.tick text');

    plot
      .appendSelect('g.axis.y')
      .call(d3.axisLeft(yScale))
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

    termGroup.selectAll('rect')
      .data(d => d.values)
      .join('rect')
      .attr('class', 'squares')
      .attr('x', d => xScale(d.id) - margin.left / this.demoList.length + 1)
      .attr('y', d => yScale(d.term) - margin.top / 2)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('fill', d => valueScale(d.values))
      // .style('fill', function(d) { console.log(d.val); })
      .style('opacity', 0);

    termGroup.selectAll('text.val')
      .data(d => d.values)
      .join('text')
      .attr('class', 'val')
      .attr('x', d => xScale(d.id) + (xScale.bandwidth() * 0.5))
      .attr('y', d => yScale(d.term) + (yScale.bandwidth() * 0.5) + 6)
      .text(d => d3.format('.1f')(d.val))
      .style('text-anchor', 'middle');

    // termGroup.appendSelect('path')
    //   .each(d => {
    //     console.log(d);
    //   })
    //   .attr('d', d => makeLine(d.values))
    //   .style('fill', 'none')
    //   .style('stroke', 'magenta')
    //   .style('stoke-width', '30px');

    const transition = plot.transition().duration(500);

    return this; // Generally, always return the chart class from draw!
  }
}

export default TopicPolling;
