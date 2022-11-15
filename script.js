function round10up(x) //taken from -> https://stackoverflow.com/a/18953446
{
    return Math.ceil(x/10)*10;
}

function round10down(x) //taken from -> https://stackoverflow.com/a/18953446
{
    return Math.floor(x/10)*10;
}

const getOrCreateLegendList = (chart, id) => { //modified from -> https://www.chartjs.org/docs/3.9.1/samples/legend/html.html
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector('ul');

  if (!listContainer) {
    listContainer = document.createElement('ul');
    listContainer.style.flexDirection = 'row';
    listContainer.style.margin = 0;
    listContainer.style.padding = 0;

    legendContainer.appendChild(listContainer);
  }

  return listContainer;
};

function storeVisibleState(){
  zz = 0;
  myChart.data.datasets.forEach(function(x) {
    visibleStateObj[x.label] = myChart.isDatasetVisible(zz)
    zz = zz + 1;
  })
}

function updateVisibleState(){
  i=0;
  myChart.data.datasets.forEach(function(x) {
    var isVisible = visibleStateObj[x.label];
    if (isVisible === true) {myChart.show(i)}
    if (isVisible === false){myChart.hide(i)}
    i = i+1;
  });
}

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

    legendObj = {}
    c = 0;
    items.forEach(item =>{ //creates a dictionary with array of positions for each occurrence of SSID
      if (legendObj[item.text] == undefined){ 
        legendObj[item.text] = [c]
      } else {
        legendObj[item.text].push(c)
      }
      c=c+1
    })

    var oldItem = "";
    var counter
    items.forEach(item => {
      
      if(item.text != oldItem){ // only allows first occurrence of each SSID through and to be visible
        oldItem = item.text;
      
        const li = document.createElement('li');
        li.style.alignItems = 'center';
        li.style.cursor = 'pointer';
        li.style.display = 'flex';
        li.style.flexDirection = 'row';
        li.style.marginLeft = '10px';

        li.onclick = () => {
          legendObj[item.text].forEach(thing => {
            chart.setDatasetVisibility(thing,!chart.isDatasetVisible(thing)) //sets visibility of all occurrences of SSID based on click of visible SSID
          })
          chart.update();
          storeVisibleState(chart);
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
      }
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

function switchMode(){

  if (plotMode == "rssiVsChannel"){ //code to change to rssiVsTime
    config.type="line";
    data.datasets = rssiVsTimeDataset;
    data.labels = times;
    config.options.scales.x.title.text = "Time (s)";
    config.options.parsing.xAxisKey = "time";
    myChart.update();
    plotMode = "rssiVsTime";
    updateVisibleState();
  } else if (plotMode == "rssiVsTime"){ //code to change to rssiVsChannel
    config.type="line";
    data.labels = channels;
    data.datasets = rssiVsChannelDataset;
    config.options.scales.x.title.text = "WiFi Channel";
    config.options.parsing.xAxisKey = "channel";
    myChart.update();
    plotMode = "rssiVsChannel";
    updateVisibleState();
  }

}

function assignColors(fullPayloadArray){
  var obj = {};

  fullPayloadArray.forEach(function(x) {
    if (obj[x[0]] == undefined){obj[x[0]] = dynamicColors()}
    if (x[0] == ""){obj["<hidden>"] = dynamicColors()}
  });

  return obj
}

var plotChartBool = true; //true until there's a problem, suppresses drawing of chart & buttons
var debugOutput = false; //enables console.logs
var plotMode = "rssiVsChannel"; //determines type of chart

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
var intArray;

for (var i = 0; i < payloadArray.length; i++) { 
    payloadArray[i][2] = Number(payloadArray[i][2]) //changing RSSI to number
    payloadArray[i][3] = Number(payloadArray[i][3]) //changing Channel to number
    intArray = payloadArray[i][4].substring(0,8).split(':').map(Number); // modified from -> https://stackoverflow.com/a/15677905
    payloadArray[i][5] = intArray[0]*60*60 + intArray[1]*60 + intArray[2]; //adding time in seconds
    latestTime = Math.max(latestTime,payloadArray[i][5])
}

var fullPayloadArray = payloadArray; //contains entire payloadArray (used for rssiVsTime), stored here because original payloadArray is filtered

//initially assigning colours
colorObject = assignColors(fullPayloadArray);

//----------------------------------------------------- RSSI vs CHANNEL CODE BEGIN -----------------------------------------------------

payloadArray = payloadArray.filter(entry => entry[5] == latestTime); //remove all rows which are not latestTime (plots values only at end of scan)

// Getting min + max RSSI
var minRSSI = 0;
var maxRSSI = -100;

for (var i = 0; i < payloadArray.length; i++) { 
    if (payloadArray[i][2]>maxRSSI){maxRSSI = payloadArray[i][2]}
    if (payloadArray[i][2]<minRSSI){minRSSI = payloadArray[i][2]}
}

function sortFunction(a, b) { 
  return a[0].localeCompare(b[0]) //localeCompare used to sort strings correctly
}

payloadArray.sort(sortFunction) //sort payloadArray

// There should be the same number of MAC addresses as length of payloadArray, if mismatch, it means that the MAC was not present at end of scan but was present during scan
if (numMacAdd != payloadArray.length){alert("Warning: Some networks present at beginning of Airport Utility WiFi scan are not present at end. Only networks at the end of the scan are shown in Signal Strength vs Channel Chart. Recommend a re-scan in Airport Utility. Dismiss to see chart anyway.")}
    
//Building rssiVsChannelDataset
rssiVsChannelDataset = []

for (var i = 0; i < payloadArray.length; i++) { 
  if (i == 0){ //pushes first data into array
    rssiVsChannelDataset.push({ 
        "label":payloadArray[i][0]=="" ? "<hidden>" : payloadArray[i][0], //replacing blank SSID with <hidden>
        "backgroundColor": colorObject[payloadArray[i][0]],
        "borderColor": "rgba(0,0,0,0)", //make lines invisible
        pointStyle: 'circle',
        pointRadius:15,
        "data":[{
          "rssi":payloadArray[i][2],
          "channel":payloadArray[i][3]
        }]
    })
  } else if (payloadArray[i][0] != payloadArray[i-1][0]){ //if ssid doesn't match previous, add next ssid
    rssiVsChannelDataset.push({
      "label":payloadArray[i][0]=="" ? "<hidden>" : payloadArray[i][0], //replacing blank SSID with <hidden>
      "backgroundColor": colorObject[payloadArray[i][0]],
      "borderColor": "rgba(0,0,0,0)", //make lines invisible
      pointStyle: 'circle',
      pointRadius:15,
      "data":[{
        "rssi":payloadArray[i][2],
        "channel":payloadArray[i][3]
      }]
    })
  } else { //if ssid matches previous, append data points
    rssiVsChannelDataset[rssiVsChannelDataset.length-1].data.push({
      "rssi":payloadArray[i][2],
      "channel":payloadArray[i][3]
    })
  }
}

// Getting Array of Channels, used as chart label
customSlice = payloadArray => payloadArray.slice(3, 4); // modified from -> https://stackoverflow.com/a/64358216
var channels = Array.from(new Set(payloadArray.map(customSlice).flat()));
channels = channels.sort(function (a, b) {  return a - b;  }); // modified from -> https://stackoverflow.com/a/21595293

//----------------------------------------------------- RSSI vs CHANNEL CODE END -----------------------------------------------------


//----------------------------------------------------- RSSI vs TIME CODE BEGIN -----------------------------------------------------

//building rssiVsTimeDataset

function sortFunction2(a, b) { 
  return a[1].localeCompare(b[1]) //localeCompare used to sort strings correctly
}

fullPayloadArray.sort(sortFunction2) //sort fullPayloadArray by MAC Address


rssiVsTimeDataset = []

for (var i = 0; i < fullPayloadArray.length; i++) { 
  if (i == 0){ //pushes first data into array
    rssiVsTimeDataset.push({ 
        "label":fullPayloadArray[i][0]=="" ? "<hidden>" : fullPayloadArray[i][0], //replacing blank SSID with <hidden>
        "backgroundColor": colorObject[fullPayloadArray[i][0]],
        "borderColor": colorObject[fullPayloadArray[i][0]],
        pointStyle: 'circle',
        pointRadius:2,
        cubicInterpolationMode: 'monotone',
        tension: 0.4,
        "data":[{
          "rssi":fullPayloadArray[i][2],
          "time":fullPayloadArray[i][5]
        }]
    })
  } else if (fullPayloadArray[i][1] != fullPayloadArray[i-1][1]){ //if mac doesn't match previous, add next ssid
    rssiVsTimeDataset.push({
      "label":fullPayloadArray[i][0]=="" ? "<hidden>" : fullPayloadArray[i][0], //replacing blank SSID with <hidden>
      "backgroundColor": colorObject[fullPayloadArray[i][0]],
      "borderColor": colorObject[fullPayloadArray[i][0]],
      pointStyle: 'circle',
      pointRadius:2,
      cubicInterpolationMode: 'monotone',
      tension: 0.4,
      "data":[{
        "rssi":fullPayloadArray[i][2],
        "time":fullPayloadArray[i][5]
      }]
    })
  } else { //if mac matches previous, append data points
    rssiVsTimeDataset[rssiVsTimeDataset.length-1].data.push({
      "rssi":fullPayloadArray[i][2],
      "time":fullPayloadArray[i][5]
    })
  }
}

function sortFunction3(a, b) { 
  return a.label.localeCompare(b.label) //localeCompare used to sort strings correctly
}

rssiVsTimeDataset.sort(sortFunction3) //sort by SSID

// Getting Array of Channels, used as chart label
customSlice = fullPayloadArray => fullPayloadArray.slice(5, 6); // modified from -> https://stackoverflow.com/a/64358216
var times = Array.from(new Set(fullPayloadArray.map(customSlice).flat()));
times = times.sort(function (a, b) {  return a - b;  }); // modified from -> https://stackoverflow.com/a/21595293

//----------------------------------------------------- RSSI vs TIME CODE END -----------------------------------------------------

visibleStateObj = {}


if (debugOutput){
  console.log("vvv payloadArray after processing vvv");
  console.log(JSON.parse(JSON.stringify(payloadArray)))  //stops "hoisting" of payloadArray, shows version at that point in code
  console.log("vvv rssiVsChannelDataset vvv")
  console.log(JSON.parse(JSON.stringify(rssiVsChannelDataset)))
}

var data = {
  labels: channels,
  datasets: rssiVsChannelDataset
};

//breakpoints for RSSI -> https://www.speedguide.net/faq/how-does-rssi-dbm-relate-to-signal-quality-percent-439
rssiStrong = 0
rssiMedium = -55;
rssiWeak = -85;
rssiWeakest = -100

//Defines the annotations for Red/Yellow/Green background when signal is strong/medium/weak
var annoStrong = { //rssiStrong
  display: true,
  type: 'box',
  backgroundColor: 'rgba(165, 214, 167, 0.1)',
  borderWidth: 0,
  yMax: rssiStrong,
  yMin: rssiMedium,
};

var annoMedium = { //rssiMedium
  display: true,
  type: 'box',
  backgroundColor: 'rgba(255, 245, 157, 0.1)',
  borderWidth: 0,
  yMax: rssiMedium,
  yMin: rssiWeak,
};

var annoWeak = { //rssiWeak
  display: true,
  type: 'box',
  backgroundColor: 'rgba(255, 133, 119, 0.07)',
  borderWidth: 0,
  yMax: rssiWeak,
  yMin: rssiWeakest,
};


var config = { //chart.js configuration variable
  type: 'line',
  data: data,
  options: {
      animation : false, 
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
        },
        annotation: { // adapted from -> https://www.chartjs.org/chartjs-plugin-annotation/latest/samples/box/quarters.html
          common: {
            drawTime: 'afterDraw'
          },
          annotations: {
            annoStrong,
            annoMedium,
            annoWeak
          }
        }
      },
      parsing: {
          xAxisKey: 'channel',
          yAxisKey: 'rssi'
      },
      scales: {
        y:{
            min: round10down(minRSSI),
            max: round10up(maxRSSI),
            ticks: {
                reverse: true, //allows for reversal of y-axis to show RSSI correctly (closer to top is better)
                stepSize: 5, //taken from -> https://stackoverflow.com/a/37719294

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

if (plotChartBool) { //if no errors, plot chart + add buttons
  
  // Plotting Chart
  var myChart = new Chart(
    document.getElementById('myChart'),
    config
  );

  storeVisibleState();
  
  // LEGEND BUTTONS (Below Legend)

  //Adding Invert Visibility Button
  var btn = document.createElement("button");
  btn.innerHTML = "Invert Visibility";
  btn.id = "hideAllBtn"
  document.getElementById('legendButtons').appendChild(btn);
  const hideAllButton = document.getElementById('hideAllBtn')
  hideAllButton.addEventListener('click', invertVis)
  function invertVis() {
    var i = 0;
    myChart.data.datasets.forEach(function() {
      var isVisible = myChart.isDatasetVisible(i);
      if (isVisible === true) {myChart.hide(i)}
      if (isVisible === false){myChart.show(i)}
      i = i+1;
    });
    storeVisibleState();
  }

  //Adding Show All Button
  var btn = document.createElement("button");
  btn.innerHTML = "Show All";
  btn.id = "showAllBtn"
  document.getElementById('legendButtons').appendChild(btn);
  const showAllButton = document.getElementById('showAllBtn')
  showAllButton.addEventListener('click', showAll)
  function showAll() {
    var i = 0;
    myChart.data.datasets.forEach(function() {
      myChart.show(i)
      i = i+1;
    });
    storeVisibleState();
  }

  //Adding Change Colors Button
  var btn = document.createElement("button");
  btn.innerHTML = "Change Colours";
  btn.id = "changeColBtn"
  document.getElementById('legendButtons').appendChild(btn);
  const resetButton = document.getElementById('changeColBtn')
  resetButton.addEventListener('click', changeColours)
  function changeColours(){
    colorObject = assignColors(fullPayloadArray); //creating new set of colours

    rssiVsChannelDataset.forEach(function(element){ //updating rssiVsChannelDataset colors
      element.backgroundColor = colorObject[element["label"]];
    })

    rssiVsTimeDataset.forEach(function(element){ //updating rssiVsTimeDataset colors
      element.backgroundColor = colorObject[element["label"]];
      element.borderColor = colorObject[element["label"]];
    })

    myChart.update() //update chart to show new colors

  }

  //Adding Switch Mode Button
  var btn = document.createElement("button");
  btn.innerHTML = "Switch Plot Mode (alpha)";
  btn.id = "switchBtn"
  document.getElementById('legendButtons').appendChild(btn);
  const switchBtn = document.getElementById('switchBtn')
  switchBtn.addEventListener('click', switchMode)
}

//Resets the page if the fragment is changed (Fixes issue #3)
window.addEventListener('hashchange', () => { //https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event
  window.location.reload();
});