const getOrCreateLegendList = (chart, id) => { //modified from -> https://www.chartjs.org/docs/3.9.1/samples/legend/html.html
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector('ul');

  if (!listContainer) {
    listContainer = document.createElement('ul');
    //listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'row';
    listContainer.style.margin = 0;
    listContainer.style.padding = 0;

    legendContainer.appendChild(listContainer);
  }

  return listContainer;
};

const htmlLegendPlugin = { //modified from -> https://www.chartjs.org/docs/3.9.1/samples/legend/html.html
  id: 'htmlLegend',
  afterUpdate(chart, args, options) {
    const ul = getOrCreateLegendList(chart, options.containerID);

    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove();
    }

    // Reuse the built-in legendItems generator
    const items = chart.options.plugins.legend.labels.generateLabels(chart);

    items.forEach(item => {
      const li = document.createElement('li');
      li.style.alignItems = 'center';
      li.style.cursor = 'pointer';
      li.style.display = 'flex';
      li.style.flexDirection = 'row';
      li.style.marginLeft = '10px';

      li.onclick = () => {
        const {type} = chart.config;
        if (type === 'pie' || type === 'doughnut') {
          // Pie and doughnut charts only have a single dataset and visibility is per item
          chart.toggleDataVisibility(item.index);
        } else {
          chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
        }
        chart.update();
      };

      // Color box
      const boxSpan = document.createElement('span');
      boxSpan.style.background = item.fillStyle;
      boxSpan.style.borderColor = item.strokeStyle;
      boxSpan.style.borderWidth = item.lineWidth + 'px';
      boxSpan.style.borderRadius = '50%';
      boxSpan.style.display = 'inline-block';
      boxSpan.style.height = '15px';
      boxSpan.style.marginRight = '10px';
      boxSpan.style.width = '15px';

      // Text
      const textContainer = document.createElement('p');
      textContainer.style.color = item.fontColor;
      textContainer.style.margin = 0;
      textContainer.style.padding = 0;
      textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

      const text = document.createTextNode(item.text);
      textContainer.appendChild(text);

      li.appendChild(boxSpan);
      li.appendChild(textContainer);
      ul.appendChild(li);
    });
  }
};

function parseCSV(str) { // taken from -> https://stackoverflow.com/a/14991797
    var arr = [];
    var quote = false;  // 'true' means we're inside a quoted field

    // Iterate over each character, keep track of current row and column (of the returned array)
    for (var row = 0, col = 0, c = 0; c < str.length; c++) {
        var cc = str[c], nc = str[c+1];        // Current character, next character
        arr[row] = arr[row] || [];             // Create a new row if necessary
        arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

        // If the current character is a quotation mark, and we're inside a
        // quoted field, and the next character is also a quotation mark,
        // add a quotation mark to the current column and skip the next character
        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

        // If it's just one quotation mark, begin/end quoted field
        if (cc == '"') { quote = !quote; continue; }

        // If it's a comma and we're not in a quoted field, move on to the next column
        if (cc == ',' && !quote) { ++col; continue; }

        // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
        // and move on to the next row and move to column 0 of that new row
        if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }

        // If it's a newline (LF or CR) and we're not in a quoted field,
        // move on to the next row and move to column 0 of that new row
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }
        if (cc == '\r' && !quote) { ++row; col = 0; continue; }

        // Otherwise, append the current character to the current column
        arr[row][col] += cc;
    }
    return arr;
}

var dynamicColors = function() { // modified from -> https://github.com/chartjs/Chart.js/issues/3431#issuecomment-256900712
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return "rgba(" + r + "," + g + "," + b + ",0.5)";
}

var plotChartBool = true; //true until there's a problem, suppresses drawing of chart & buttons
var debugOutput = false; //enables console.logs

var payload = decodeURI(window.location.hash.replaceAll(/\,\%20/g,","));  // pulls data from URL fragment and removes urlencoded spaces

if (payload.length === 0){ //no fragment
  alert("ERROR - No payload detected. Either a) your iOS Shortcut is set up incorrectly b) you have browsed directly to this URL")
  plotChartBool = false;
} else if (payload.slice(-11) !== "_endpayload") { //no _endpayload at end of data implying data truncated (Shortcut adds this)
  alert("ERROR - Data has been truncated and is missing, either a) choose a shorter time in Airport Utility b) refrain from copying URL from browser (doesn't show entire URL)");
  plotChartBool = false;
}

payload = payload.substring(0, payload.length - 11); //removing _endpayload from payload

var payloadArray = parseCSV(payload);  // parses payload into array

if (debugOutput){
  console.log("vvv payloadArray before processing vvv");
  console.log(JSON.parse(JSON.stringify(payloadArray)));
}

payloadArray.shift();   // removes first entry, SSID BSS RSSI etc

// Counting the number of unique MAC addresses, used for error checking
var customSlice = payloadArray => payloadArray.slice(1, 2); // modified from -> https://stackoverflow.com/a/64358216
var macAdd = Array.from(new Set(payloadArray.map(customSlice).flat()));
var numMacAdd = macAdd.length

// Getting Latest Time stamp + appending time in seconds to payloadArray + converting numbers
var latestTime = 0;

for (var i = 0; i < payloadArray.length; i++) { 
    payloadArray[i][2] = Number(payloadArray[i][2]) //changing RSSI to number
    payloadArray[i][3] = Number(payloadArray[i][3]) //changing Channel to number
    var intArray = payloadArray[i][4].split(':').map(Number); // modified from -> https://stackoverflow.com/a/15677905
    payloadArray[i][5] = intArray[0]*60*60 + intArray[1]*60 + intArray[2]; //adding time in seconds
    latestTime = Math.max(latestTime,payloadArray[i][5])
}

payloadArray = payloadArray.filter(entry => entry[5] == latestTime); //remove all rows which are not latestTime (plots values only at end of scan)

function sortFunction(a, b) { 
  return a[0].localeCompare(b[0]) //localeCompare used to sort strings correctly
}

payloadArray.sort(sortFunction) //sort payloadArray

// There should be the same number of MAC addresses as length of payloadArray, if mismatch, it means that the MAC was not present at end of scan but was present during scan
if (numMacAdd != payloadArray.length){alert("Warning: Some networks present at beginning of Airport Utility WiFi scan are not present at end. Only networks at the end of the scan are shown. Recommend a re-scan in Airport Utility. Dismiss to see graph anyway.")}
    
//Building wifiDataset that chart.js will use
wifiDataset = []

for (var i = 0; i < payloadArray.length; i++) { 
  wifiDataset.push({
      "label":payloadArray[i][0]=="" ? "<hidden>" : payloadArray[i][0], //replacing blank SSID with <hidden>
      "backgroundColor": i>0 ? payloadArray[i][0]==payloadArray[i-1][0] ? wifiDataset[wifiDataset.length-1].backgroundColor : dynamicColors() : dynamicColors(),
      // ^^ gives same SSID the same random color 
      pointStyle: 'circle',
      pointRadius:15,
      "data":[{
        "rssi":payloadArray[i][2],
        "channel":payloadArray[i][3]
      }]
  })
}

if (debugOutput){
  console.log("vvv payloadArray after processing vvv");
  console.log(JSON.parse(JSON.stringify(payloadArray)))  //stops "hoisting" of payloadArray, shows version at that point in code
  console.log("vvv wifiDataset vvv")
  console.log(JSON.parse(JSON.stringify(wifiDataset)))
}

// Getting Array of Channels, used as chart label
customSlice = payloadArray => payloadArray.slice(3, 4); // modified from -> https://stackoverflow.com/a/64358216
var channels = Array.from(new Set(payloadArray.map(customSlice).flat()));
channels = channels.sort(function (a, b) {  return a - b;  }); // modified from -> https://stackoverflow.com/a/21595293

// X-axis is channel
// Y-axis is RSSI (signal strength)

  var data = {
    labels: channels,
    datasets: wifiDataset
  };

  const config = {
    type: 'line',
    data: data,
    options: {
        maintainAspectRatio:false,
        responsive:true,
        skipNull:true,
        interaction: { //defines tooltip behaviour
          axis: "x",
          intersect: false,
          mode: 'nearest',
        },
        plugins:{
          htmlLegend: {
            containerID: 'legend-container'
          },
          tooltip: {
            callbacks:{
              title: function(context) {
                let title = "Channel "+context[0].label; // Adds "Channel" to tooltip. eg. 1 becomes Channel 1
                return title;
              }
          },
            itemSort: function(a, b) {
              return b.raw.rssi - a.raw.rssi; //sorts the tooltip by RSSI to match chart
            },
            usePointStyle: true,
          },
          legend:{
            display:false,
          }
        },
        parsing: {
            xAxisKey: 'channel',
            yAxisKey: 'rssi'
        },
        scales: {
          y:{
              ticks: {
                  reverse: true, //allows for reversal of y-axis to show RSSI correctly (closer to top is better)
              },
              title:{
                display:true,
                text:"Signal Strength (dB)"
              }
          },
          x:{
            title:{
              display:true,
              text:"WiFi Channel"
            }
          }
        }
    },
    plugins: [htmlLegendPlugin],
  };

  if (plotChartBool) { //if no errors, plot chart + add button
    
    // Plotting Chart
    const myChart = new Chart(
      document.getElementById('myChart'),
      config
    );
    
    //Adding Reset Button
    let btn = document.createElement("button");
    btn.innerHTML = "Reset + Change Colours";
    btn.id = "resetBtn"
    document.getElementById('settingButtons').appendChild(btn);
    const resetButton = document.getElementById('resetBtn')
    resetButton.addEventListener('click', resetPage)
    function resetPage(){
      window.location.reload();
    }

  }

//Resets the page if the fragment is changed (Fixes issue #3)
window.addEventListener('hashchange', () => { //https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event
  resetPage()
});