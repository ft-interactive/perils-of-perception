import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import throttle from 'lodash/throttle';
import d3 from 'd3';

class ColumnChart extends Component {
  constructor(props) {
    super(props);

    // Calculate height at 2.35:1 aspect ratio
    const calculatedHeight = this.props.parentWidth / 2.35;
    // Make sure height is never lower than n
    const height = calculatedHeight < 75 ? 75 : calculatedHeight;

    this.state = {
      width: this.props.parentWidth,
      height,
      // Placeholder content displayed before chart render
      chart: 'Loading chart…',
    };
    this.handleResize = this.handleResize.bind(this);
    this.redrawChart = this.redrawChart.bind(this);

    for (const mixin in ReactFauxDOM.mixins.anim) { // eslint-disable-line
      if ({}.hasOwnProperty.call(ReactFauxDOM.mixins.anim, mixin)) {
        this[mixin] = ReactFauxDOM.mixins.anim[mixin].bind(this);
      }
    }

    for (const mixin in ReactFauxDOM.mixins.core) { // eslint-disable-line
      if ({}.hasOwnProperty.call(ReactFauxDOM.mixins.core, mixin)) {
        this[mixin] = ReactFauxDOM.mixins.core[mixin].bind(this);
      }
    }
  }

  componentDidMount() {
    // Create a faux SVG and store its virtual DOM in state.chart
    const chart = this.connectFauxDOM('svg', 'chart');
    // Get chart data off component props
    const data = this.props.data;
    // Run some D3 on the faux SVG
    const margin = { // Mike Bostock's margin convention
      top: 20,
      right: 10,
      bottom: 20,
      left: 10,
    };
    const width = this.state.width - margin.left - margin.right;
    const height = this.state.height - margin.top - margin.bottom;
    const x = d3.scale.linear()
        .domain([0, data.length])
        .range([0, width]);
    const y = d3.scale.linear()
        .domain([0, 100])
        .range([height, 0]);
    const xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .tickValues([10, 20, 30, 40, 50, 60, 70, 80, 90])
        .outerTickSize(0);
    const yAxis = d3.svg.axis()
        .scale(y)
        .orient('left')
        .tickValues([50, 100])
        .tickSize(-width);
    const svg = d3.select(chart)
        .attr('width', width + margin.left + margin.right)
        .attr('height', 0)
        .attr('class', 'column-chart');

    svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(1, 0)')
        .call(yAxis);

    const bar = svg.selectAll('.bar')
        .data(data)
      .enter().append('g')
        .attr('class', 'bar')
        .attr('transform', (d, i) =>
          `translate(${i * (width / data.length)}, 0)`
        );
    const rect = bar.append('rect')
        .attr('x', 1)
        .attr('y', height)
        .attr('width', width / data.length)
        .attr('height', 0)
        .attr('fill', d => {
          const color = d === d3.max(data) ? '#9e2f50' : null;
          return color;
        })
        .attr('stroke-width', () => {
          const rectWidth = d3.select(chart)
              .select('rect')
              .attr('width');
          return rectWidth * 0.1;
        });

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(1, ${height})`)
        .call(xAxis);

    // Set up on-render transitions
    svg.transition()
        .duration(500)
        .attr('height', height + margin.top + margin.bottom);

    rect.transition()
        .ease('elastic')
        .delay((d, i) => 500 + (i * 7.5))
        .duration(500)
        .attr('y', d =>
          height - ((d / 100) * height)
        )
        .attr('height', d =>
          (d / 100) * height
        );

    // Kick off transitions
    this.animateFauxDOM(2000);

    // Add window resize event listener
    window.addEventListener('resize', throttle(this.handleResize, 500));
  }

  handleResize() {
    // Repeat height calculation with fallback value as above
    const calculatedHeight = this.node.offsetWidth / 2.35;
    const height = calculatedHeight < 75 ? 75 : calculatedHeight;

    this.setState({
      width: this.node.offsetWidth,
      height,
    });
    this.redrawChart();
  }

  redrawChart() {
    // Access the SVG virtual DOM
    const chart = this.connectedFauxDOM.chart;
    // Access the data
    const data = this.props.data;
    // Redraw the chart
    const margin = {
      top: 20,
      right: 10,
      bottom: 20,
      left: 10,
    };
    const width = this.state.width - margin.left - margin.right;
    const height = this.state.height - margin.top - margin.bottom;
    const x = d3.scale.linear()
        .domain([0, data.length])
        .range([0, width]);
    const y = d3.scale.linear()
        .domain([0, 100]) // TODO: set domain upper bound per chart requirements
        .range([height, 0]);
    const xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .tickValues([10, 20, 30, 40, 50, 60, 70, 80, 90])
        .outerTickSize(0);
    const yAxis = d3.svg.axis()
        .scale(y)
        .orient('left')
        .tickValues([50, 100])
        .tickSize(-width);

    // Update chart width and drill down to update x axis
    d3.select(chart)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .select('.x')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis);

    // Come back up to update y axis
    d3.select(chart).select('.y')
        .attr('transform', 'translate(1, 0)')
        .call(yAxis);

    // Come back up again to update bars
    d3.select(chart).selectAll('.bar')
        .attr('transform', (d, i) =>
          `translate(${i * (width / data.length)}, 0)`
        )
      .select('rect')
        .attr('y', d =>
          height - ((d / 100) * height)
        )
        .attr('width', width / data.length)
        .attr('height', d =>
          (d / 100) * height
        )
        .attr('stroke-width', () => {
          const rectWidth = d3.select(chart)
              .select('rect')
              .attr('width');
          return rectWidth * 0.1;
        });

    this.drawFauxDOM();
  }

  render() {
    return (
      <div
        ref={node => { this.node = node; }}
        className="output-chart-container"
      >
        {this.state.chart}
      </div>
    );
  }
}

ColumnChart.propTypes = {
  data: React.PropTypes.array,
  parentWidth: React.PropTypes.number,
};

export default ColumnChart;
