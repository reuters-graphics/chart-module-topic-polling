<!-- ⭐ Write an interactive DEMO of your chart in this component.
Follow the notes below! -->
<script>
  export let responsive; // eslint-disable-line
  import { afterUpdate } from 'svelte';
  import Docs from './App/Docs.svelte';
  import Explorer from './App/Explorer.svelte';
  import TopicPolling from '../js/index';
  import testData from '../js/testdata.json';

  let chart = new TopicPolling();
  let chartContainer;

  // 🎚️ Create variables for any data or props you want users to be able
  // to update in the demo. (And write buttons to update them below!)
  let defaultDemoKey = 'Respondents:AllRespondents';
  let defaultDateKey = '2021-03-17 - 2021-03-18';
  let dropDownDemoArray = setDropdownDemoData();
  let dropDownDateArray = testData.dates;

  let chartData = testData.demographics[defaultDemoKey];
  let chartData2 = testData.dates[defaultDateKey];
  // let categoryData = testData

  let circleFill = 'steelblue';
  // ...

  $: chartProps = {
    dates: testData.dates,
    selectedDate: defaultDateKey,
    selectedDemo: 'Party',
    omit:["NoneDK","DK","Prefernottoanswer","Other","NoAnswer","Independent"],
    demographicLookup:{
      Respondents:{},
      RegisterdVoter:{},
      Party:{
      All: 'All',
      Republican: 'Republican',
      Democrat: 'Democrat',
      },
      Age: {
      },
      Age: {},
      Gender: {},
      Residence: {},
      Education: {},
      Race: {},
      Income: {},
      MaritalStatus: {},
      Employment: {},
      HomeOwnership: {},
    },
    translation: {
      en: {
        'Economy, unemployment, and jobs': 'Economy',
        'Public health, disease, and illness': 'Public health',
        'Health care system': 'Health care',
        Immigration: 'Immigration',
        'Crime or corruption': 'Crime',
        'Inequality and discrimination': 'Inequality',
        Morality: 'Morality',
        Education: 'Education',
        'Environment and climate': 'Environment',
        'Terrorism and extremism': 'Terrorism',
        'War and foreign conflicts': 'War/conflict',
        'Energy issues': 'Energy issues',
      },
    },
  };

  console.log('dropDownDemoArray', dropDownDemoArray);

  afterUpdate(() => {
    // 💪 Create a new chart instance of your module.
    chart = new TopicPolling();
    // ⚡ And let's use your chart!
    chart
      .selection(chartContainer)
      .data(testData) // Pass your chartData
      .props(chartProps) // Pass your chartProps
      .draw(); // 🚀 DRAW IT!
  });

  function setDropdownDemoData() {
    let demographics = {};

    Object.keys(testData.demographics).forEach((d) => {
      let parent = d.split(':')[0];
      let child = d.split(':')[1];

      demographics[parent] = demographics[parent]
        ? demographics[parent]
        : { id: parent, values: [] };
      demographics[parent].values.push(child);
    });
    return Object.values(demographics);
  }

  function getDemoVal() {
    //chartProps.selected = document.getElementById("dropdownDemo").value;
    //chartData = testData.demographics[chartProps.selected];
  }

  function getDateVal() {
    chartProps.selected = document.getElementById('dropdownDate').value;
    chartData = testData.dates[chartProps.selected];
  }

  // Creates array of random variables for 3 circles.
  function getRandomData() {
    const arr = [];
    for (let i = 0; i < 3; i++) {
      const d = {
        x: Math.floor(Math.random() * Math.floor(100)), //Random int 0-100
        y: Math.floor(Math.random() * Math.floor(100)), //Random int 0-100
        r: Math.floor(Math.random() * Math.floor(30 - 10) + 10), //Random int 10-30
      };
      arr.push(d);
    }
    return arr;
  }
</script>

<div id="topic-polling-chart-container" bind:this={chartContainer} />

<div class="chart-options">
  <!-- svelte-ignore a11y-no-onchange -->
  <select
    bind:value={chartProps.selectedDemo}
    name="dropdownDemo"
    id="dropdownDemo"
    on:change={() => getDemoVal()}
  >
    <!-- {#each dropDownDemoArray as demo}
      <optgroup label="{demo.id}">
        {#each demo.values as demoVal}
          <option value="{demo.id}:{demoVal}">{demoVal}</option>
        {/each}
      </optgroup>
    {/each} -->

    {#each dropDownDemoArray as demo}
      <option value={demo.id}>{demo.id}</option>
    {/each}
  </select>

  <!-- svelte-ignore a11y-no-onchange -->
  <select
    bind:value={chartProps.selectedDate}
    name="dropdownDate"
    id="dropdownDate"
    on:change={() => getDateVal()}
  >
    {#each dropDownDateArray as demo}
      <option value={demo}>{demo}</option>
    {/each}
  </select>
</div>

<!-- ⚙️ These components will automatically create interactive documentation for you chart! -->
<Docs />
<Explorer title="Data" data={chart.data()} />
<Explorer title="Props" data={chart.props()} />

<!-- 🖌️ Style your demo page here -->
<style lang="scss">
  .chart-options {
    button {
      padding: 5px 15px;
    }
  }
</style>
